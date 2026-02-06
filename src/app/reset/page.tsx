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
      <div className="app-shell flex items-center justify-center">
        <p className="text-sm text-[#6b6660]">Laster inn...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!isAdmin) {
    return (
      <div className="app-shell flex items-center justify-center p-4">
        <div className="card p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2 text-[#1f1d1b]">Ingen tilgang</h1>
          <p className="text-sm text-[#6b6660] mb-4">Denne siden er kun for admin.</p>
          <Link
            href="/dashboard"
            className="btn btn-neutral"
          >
            Tilbake
          </Link>
        </div>
      </div>
    )
  }

  const canReset = confirmText.trim().toLowerCase() === 'slett alt'

  return (
    <div className="app-shell p-4">
      <div className="max-w-xl mx-auto mt-10">
        <div className="card p-6">
          <h1 className="text-2xl font-semibold text-[#c0392b] mb-2">⚠️ Reset</h1>
          <p className="text-sm text-[#6b6660] mb-4">
            Dette sletter alle produkter, innkjop og salg. Dette kan ikke angres.
          </p>

          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            Skriv <strong>SLETT ALT</strong> for a bekrefte.
          </div>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="SLETT ALT"
            className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm mb-4"
          />

          <button
            onClick={handleReset}
            disabled={!canReset || loading}
            className="btn btn-danger w-full text-sm"
          >
            {loading ? 'Sletter...' : 'Tilbakestill alt'}
          </button>

          {message && (
            <div className="mt-4 text-sm text-[#6b6660]">{message}</div>
          )}

          <div className="mt-4">
            <Link href="/dashboard" className="text-sm text-[#1f1d1b]">
              Tilbake til dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
