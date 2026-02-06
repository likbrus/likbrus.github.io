'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  buy_price: number
  sell_price: number
  stock: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [sellingStates, setSellingStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
      // Set up real-time subscriptions using the newer API
      const productsSubscription = supabase
        .channel('products-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => fetchProducts()
        )
        .subscribe()

      const salesSubscription = supabase
        .channel('sales-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
          () => fetchTotalProfit()
        )
        .subscribe()

      return () => {
        productsSubscription.unsubscribe()
        salesSubscription.unsubscribe()
      }
    }
  }, [user])

  const fetchData = async () => {
    try {
      await Promise.all([fetchProducts(), fetchTotalProfit()])
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchTotalProfit = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('profit')

      if (error) throw error

      const total = data?.reduce((sum, sale) => sum + (sale.profit || 0), 0) || 0
      setTotalProfit(total)
    } catch (error) {
      console.error('Error fetching total profit:', error)
    }
  }

  const handleQuickSale = async (product: Product) => {
    setSellingStates((prev) => ({ ...prev, [product.id]: true }))

    try {
      const newStock = product.stock - 1
      const profit = (product.sell_price - product.buy_price) * 1

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id)

      if (updateError) throw updateError

      // Record sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          product_id: product.id,
          quantity: 1,
          profit,
        })

      if (saleError) throw saleError

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, stock: newStock } : p
        )
      )
      setTotalProfit((prev) => prev + profit)
    } catch (error) {
      console.error('Error recording sale:', error)
    } finally {
      setSellingStates((prev) => ({ ...prev, [product.id]: false }))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Laster inn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">🥤 Brus Lager</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pt-6 space-y-6">
        {/* Profit Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Total fortjeneste</p>
          <h2 className="text-4xl font-bold text-green-600">
            {totalProfit.toLocaleString('no-NO')} kr
          </h2>
        </div>

        {/* Products */}
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              Ingen produkter registrert. {isAdmin && 'Gå til Admin for å legge til.'}
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Lager: <span className="font-bold">{product.stock}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Salg: {product.sell_price} kr | Innkjøp: {product.buy_price} kr
                  </p>
                </div>
                <button
                  onClick={() => handleQuickSale(product)}
                  disabled={sellingStates[product.id] || product.stock === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-lg min-w-fit transition"
                >
                  {sellingStates[product.id] ? '...' : '➖ Solgt 1'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
