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
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[#6b6660]">Laster inn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell pb-20 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 right-[-20%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,192,70,0.55),transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(49,195,164,0.5),transparent_60%)] blur-3xl" />

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4">
        <div className="glass mx-auto max-w-2xl rounded-3xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b6660]">Lager</p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1f1d1b]">
              🥤 Brus Lager
            </h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="btn btn-neutral text-sm"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-danger text-sm"
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-2xl p-4 pt-6 space-y-6">
        {/* Profit Summary */}
        <div className="card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6b6660]">Total fortjeneste</p>
          <div className="mt-3 flex items-end justify-between">
            <h2 className="text-4xl font-semibold text-[#1f1d1b]">
              {totalProfit.toLocaleString('no-NO')} kr
            </h2>
            <span className="pill">Live</span>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="card p-6 text-center text-sm text-[#6b6660]">
              Ingen produkter registrert. {isAdmin && 'Gå til Admin for å legge til.'}
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#1f1d1b]">
                      {product.name}
                    </h3>
                    <span className="pill">Lager {product.stock}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b6660]">
                    Salg: {product.sell_price} kr · Innkjop: {product.buy_price} kr
                  </p>
                </div>
                <button
                  onClick={() => handleQuickSale(product)}
                  disabled={sellingStates[product.id] || product.stock === 0}
                  className="btn btn-primary text-sm"
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
