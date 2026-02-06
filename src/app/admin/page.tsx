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
  const [deleteStates, setDeleteStates] = useState<Record<string, boolean>>({})

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

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Slette ${productName} og all historikk?`)) return

    setDeleteStates((prev) => ({ ...prev, [productId]: true }))
    setFormError('')
    setFormSuccess('')

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setFormSuccess('Produkt slettet.')
      await fetchProducts()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Feil oppstod')
    } finally {
      setDeleteStates((prev) => ({ ...prev, [productId]: false }))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <p className="text-sm text-[#6b6660]">Laster inn...</p>
      </div>
    )
  }

  return (
    <div className="app-shell pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4">
        <div className="glass mx-auto max-w-2xl rounded-3xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6b6660]">Admin</p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1f1d1b]">⚙️ Kontrollpanel</h1>
          </div>
          <Link
            href="/dashboard"
            className="btn btn-neutral text-sm"
          >
            Tilbake
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl p-4 pt-6">
        {/* Tabs */}
        <div className="card mb-6 flex gap-2 p-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`tab-pill flex-1 text-sm transition ${
              activeTab === 'products'
                ? 'bg-[#1f1d1b] text-white'
                : 'text-[#4c4742] hover:bg-[#f7efe7]'
            }`}
          >
            Produkter
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`tab-pill flex-1 text-sm transition ${
              activeTab === 'purchases'
                ? 'bg-[#1f1d1b] text-white'
                : 'text-[#4c4742] hover:bg-[#f7efe7]'
            }`}
          >
            Innkjøp
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`tab-pill flex-1 text-sm transition ${
              activeTab === 'sales'
                ? 'bg-[#1f1d1b] text-white'
                : 'text-[#4c4742] hover:bg-[#f7efe7]'
            }`}
          >
            Salg
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#1f1d1b] mb-4">Legg til nytt produkt</h2>
              {formError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formSuccess}
                </div>
              )}
              <form onSubmit={handleAddProduct} className="space-y-4">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Produktnavn (f.eks. Cola)"
                  className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newProductBuyPrice}
                  onChange={(e) => setNewProductBuyPrice(e.target.value)}
                  placeholder="Innkjøpspris (kr)"
                  className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newProductSellPrice}
                  onChange={(e) => setNewProductSellPrice(e.target.value)}
                  placeholder="Salgspris (kr)"
                  className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                />
                <input
                  type="number"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  placeholder="Startlager (frivillig)"
                  className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full text-sm"
                >
                  Legg til produkt
                </button>
              </form>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#1f1d1b] mb-4">Aktive produkter</h2>
              {products.length === 0 ? (
                <p className="text-sm text-[#6b6660]">Ingen produkter ennå</p>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-[#efe6df] bg-[#fffaf4] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#1f1d1b]">{product.name}</h3>
                        <span className="pill">Lager {product.stock}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#6b6660]">
                        Innkjøp: {product.buy_price} kr · Salg: {product.sell_price} kr
                      </p>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          disabled={deleteStates[product.id]}
                          className="btn btn-danger text-xs"
                        >
                          {deleteStates[product.id] ? 'Sletter...' : 'Slett produkt'}
                        </button>
                      </div>
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
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#1f1d1b] mb-4">Registrer innkjøp</h2>
              {formError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formSuccess}
                </div>
              )}
              <form onSubmit={handleAddPurchase} className="space-y-4">
                <select
                  value={purchaseProductId}
                  onChange={(e) => setPurchaseProductId(e.target.value)}
                  className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
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
                  className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                />
                <input
                  type="number"
                  step="0.01"
                  value={purchasePricePerUnit}
                  onChange={(e) => setPurchasePricePerUnit(e.target.value)}
                  placeholder="Pris per enhet (kr)"
                  className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full text-sm"
                >
                  Registrer innkjøp
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-[#1f1d1b] mb-4">Salgslogg</h2>
            {sales.length === 0 ? (
              <p className="text-sm text-[#6b6660]">Ingen salg registrert ennå</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-2xl border border-[#efe6df] bg-white/80 p-3"
                  >
                    <p className="font-semibold text-[#1f1d1b]">
                      {sale.product_name} x{sale.quantity}
                    </p>
                    <p className="text-xs text-[#6b6660]">
                      Fortjeneste: {sale.profit.toLocaleString('no-NO')} kr
                    </p>
                    <p className="text-xs text-[#9c948c]">
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
