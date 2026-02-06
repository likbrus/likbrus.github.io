'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card relative overflow-hidden p-8">
          <div className="pointer-events-none absolute -top-12 -right-16 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,192,70,0.6),transparent_60%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,106,61,0.45),transparent_60%)] blur-2xl" />

          <div className="relative">
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f1d1b]">
              🥤 Brus Lager
            </h1>
            <p className="mt-2 text-sm text-[#6b6660]">
              Rask lager- og salgsapp for idrettslaget
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4c4742] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                placeholder="din@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4c4742] mb-2">
                Passord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#e6ded8] bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-base"
            >
              {loading ? 'Logger inn...' : 'Logg inn'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
