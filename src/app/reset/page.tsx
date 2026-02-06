'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ResetPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleReset = async () => {
    setLoading(true)
    setMessage('')

    try {
      const deleteSales = await supabase
        .from('sales')
        .delete()
        .not('id', 'is', null)

      if (deleteSales.error) throw deleteSales.error

      const deletePurchases = await supabase
        .from('purchases')
        .delete()
        .not('id', 'is', null)

      if (deletePurchases.error) throw deletePurchases.error

      const deleteProducts = await supabase
        .from('products')
        .delete()
        .not('id', 'is', null)

      if (deleteProducts.error) throw deleteProducts.error

      setMessage('Alt er tilbakestilt.')
      setConfirmText('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ukjent feil'
      setMessage(`Feil: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Laster inn...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-2">Ingen tilgang</h1>
          <p className="text-gray-600 mb-4">Denne siden er kun for admin.</p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Tilbake
          </Link>
        </div>
      </div>
    )
  }

  const canReset = confirmText.trim().toLowerCase() === 'slett alt'

  return (
    <div className="min-h-screen bg-red-50 p-4">
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-2">⚠️ Reset</h1>
          <p className="text-gray-700 mb-4">
            Dette sletter alle produkter, innkjop og salg. Dette kan ikke angres.
          </p>

          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            Skriv <strong>SLETT ALT</strong> for a bekrefte.
          </div>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="SLETT ALT"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          />

          <button
            onClick={handleReset}
            disabled={!canReset || loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg"
          >
            {loading ? 'Sletter...' : 'Tilbakestill alt'}
          </button>

          {message && (
            <div className="mt-4 text-sm text-gray-700">{message}</div>
          )}

          <div className="mt-4">
            <Link href="/dashboard" className="text-sm text-blue-600">
              Tilbake til dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
