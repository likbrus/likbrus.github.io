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
  created_at: string
}

interface Sale {
  id: string
  product_id: string
  quantity: number
  profit: number
  created_at: string
  product_name?: string
}

type Tab = 'products' | 'purchases' | 'sales'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [loading, setLoading] = useState(true)

  // Form states
  const [newProductName, setNewProductName] = useState('')
  const [newProductBuyPrice, setNewProductBuyPrice] = useState('')
  const [newProductSellPrice, setNewProductSellPrice] = useState('')
  const [newProductStock, setNewProductStock] = useState('')

  const [purchaseProductId, setPurchaseProductId] = useState('')
  const [purchaseQuantity, setPurchaseQuantity] = useState('')
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState('')

  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/dashboard')
    }
  }, [user, authLoading, isAdmin, router])

  useEffect(() => {
    if (user && isAdmin) {
      fetchData()
    }
  }, [user, isAdmin])

  const fetchData = async () => {
    try {
      await Promise.all([fetchProducts(), fetchSales()])
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

  const fetchSales = async () => {
    try {
      const { data: salesData, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Fetch product names for sales
      if (salesData) {
        const enrichedSales = await Promise.all(
          salesData.map(async (sale) => {
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', sale.product_id)
              .single()
            return {
              ...sale,
              product_name: product?.name || 'Unknown',
            }
          })
        )
        setSales(enrichedSales as Sale[])
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!newProductName || !newProductBuyPrice || !newProductSellPrice) {
      setFormError('Vennligst fyll ut alle felt')
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: newProductName,
          buy_price: parseFloat(newProductBuyPrice),
          sell_price: parseFloat(newProductSellPrice),
          stock: parseInt(newProductStock) || 0,
        })

      if (error) throw error

      setFormSuccess('Produkt lagt til!')
      setNewProductName('')
      setNewProductBuyPrice('')
      setNewProductSellPrice('')
      setNewProductStock('')
      await fetchProducts()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Feil oppstod')
    }
  }

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!purchaseProductId || !purchaseQuantity || !purchasePricePerUnit) {
      setFormError('Vennligst fyll ut alle felt')
      return
    }

    try {
      const product = products.find((p) => p.id === purchaseProductId)
      if (!product) throw new Error('Produkt ikke funnet')

      const quantity = parseInt(purchaseQuantity)
      const pricePerUnit = parseFloat(purchasePricePerUnit)

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: product.stock + quantity })
        .eq('id', purchaseProductId)

      if (updateError) throw updateError

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          product_id: purchaseProductId,
          quantity,
          price_per_unit: pricePerUnit,
        })

      if (purchaseError) throw purchaseError

      setFormSuccess('Innkjøp registrert!')
      setPurchaseProductId('')
      setPurchaseQuantity('')
      setPurchasePricePerUnit('')
      await fetchProducts()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Feil oppstod')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Laster inn...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">⚙️ Admin</h1>
          <Link
            href="/dashboard"
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
          >
            Tilbake
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pt-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg shadow-sm p-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Produkter
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition ${
              activeTab === 'purchases'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Innkjøp
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Salg
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Legg til nytt produkt</h2>
              {formError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {formSuccess}
                </div>
              )}
              <form onSubmit={handleAddProduct} className="space-y-4">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Produktnavn (f.eks. Cola)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newProductBuyPrice}
                  onChange={(e) => setNewProductBuyPrice(e.target.value)}
                  placeholder="Innkjøpspris (kr)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newProductSellPrice}
                  onChange={(e) => setNewProductSellPrice(e.target.value)}
                  placeholder="Salgspris (kr)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  placeholder="Startlager (frivillig)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                >
                  Legg til produkt
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Aktive produkter</h2>
              {products.length === 0 ? (
                <p className="text-gray-500">Ingen produkter ennå</p>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Innkjøp: {product.buy_price} kr | Salg: {product.sell_price} kr | Lager: {product.stock}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Registrer innkjøp</h2>
              {formError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {formSuccess}
                </div>
              )}
              <form onSubmit={handleAddPurchase} className="space-y-4">
                <select
                  value={purchaseProductId}
                  onChange={(e) => setPurchaseProductId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Velg produkt</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Lager: {p.stock})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(e.target.value)}
                  placeholder="Antall"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.01"
                  value={purchasePricePerUnit}
                  onChange={(e) => setPurchasePricePerUnit(e.target.value)}
                  placeholder="Pris per enhet (kr)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                >
                  Registrer innkjøp
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Salgslogg</h2>
            {sales.length === 0 ? (
              <p className="text-gray-500">Ingen salg registrert ennå</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <p className="font-bold">
                      {sale.product_name} x{sale.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fortjeneste: {sale.profit.toLocaleString('no-NO')} kr
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(sale.created_at).toLocaleString('no-NO')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
