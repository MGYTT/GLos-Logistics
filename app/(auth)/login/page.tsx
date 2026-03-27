'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Truck, Mail, Lock, Eye, EyeOff,
  ChevronRight, Loader2, UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Variants ─────────────────────────────────
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: {
      duration: 0.5,
      // ✅ fix: tuple as const zamiast number[]
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
}

const container: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

// ─── Page ──────────────────────────────────────
export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    })

    if (authError) {
      setLoading(false)
      setError(
        authError.message.includes('Invalid login')
          ? 'Nieprawidłowy e-mail lub hasło.'
          : authError.message.includes('Email not confirmed')
          ? 'Potwierdź adres e-mail przed zalogowaniem.'
          : 'Wystąpił błąd. Spróbuj ponownie.'
      )
      return
    }

    toast.success('Zalogowano! Przekierowuję do Huba...')
    router.push('/hub')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center
                    justify-center px-4 relative overflow-hidden">

      {/* Tło — glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[600px] h-[600px] bg-amber-500/4 rounded-full
                      blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-600/4
                      rounded-full blur-[100px] pointer-events-none" />

      {/* Siatka */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245,158,11,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.04,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative z-10"
      >

        {/* Logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group mb-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 bg-amber-500 rounded-2xl flex items-center
                         justify-center shadow-lg shadow-amber-500/30"
            >
              <Truck className="w-6 h-6 text-black" />
            </motion.div>
            <span className="font-black text-2xl bg-gradient-to-r from-amber-400
                             to-orange-400 bg-clip-text text-transparent">
              GLos Logistics
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white">Witaj z powrotem</h1>
          <p className="text-sm text-zinc-500 mt-1">Zaloguj się do panelu kierowcy</p>
        </motion.div>

        {/* Formularz */}
        <motion.div
          variants={fadeUp}
          className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4"
        >
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400
                                uppercase tracking-wider">
                Adres e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2
                                 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  placeholder="kierowca@vtc.pl"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className={cn(
                    'w-full bg-zinc-800/60 border border-zinc-700 rounded-xl',
                    'pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600',
                    'outline-none transition-all duration-200',
                    'focus:border-amber-500/60 focus:bg-zinc-800',
                    'disabled:opacity-50',
                    error && 'border-red-500/50',
                  )}
                />
              </div>
            </div>

            {/* Hasło */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400
                                uppercase tracking-wider">
                Hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                                 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className={cn(
                    'w-full bg-zinc-800/60 border border-zinc-700 rounded-xl',
                    'pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600',
                    'outline-none transition-all duration-200',
                    'focus:border-amber-500/60 focus:bg-zinc-800',
                    'disabled:opacity-50',
                    error && 'border-red-500/50',
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPass
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye    className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Błąd */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border
                           border-red-500/20 rounded-xl px-3 py-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className={cn(
                'w-full h-11 font-black text-sm gap-2 relative overflow-hidden group',
                'bg-amber-500 hover:bg-amber-400 text-black',
                'shadow-lg shadow-amber-500/20 transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logowanie...
                </>
              ) : (
                <>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent
                                   via-white/20 to-transparent -translate-x-full
                                   group-hover:translate-x-full transition-transform
                                   duration-500" />
                  Zaloguj się
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5
                                           transition-transform" />
                </>
              )}
            </Button>

          </form>

          {/* Zapomniałem hasła */}
          <div className="text-center pt-1">
            <Link
              href="/reset-password"
              className="text-xs text-zinc-600 hover:text-amber-400 transition-colors"
            >
              Zapomniałem hasła
            </Link>
          </div>
        </motion.div>

        {/* ── Rejestracja ───────────────────────── */}
        <motion.div variants={fadeUp} className="mt-3">
          <Link href="/register" className="block group">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-zinc-900/40 border border-zinc-800 group-hover:border-blue-500/30
                         rounded-xl px-4 py-3 flex items-center justify-between gap-3
                         transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center
                                justify-center shrink-0 group-hover:bg-blue-500/20
                                transition-colors">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-300">
                    Zarejestruj się
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Utwórz konto kierowcy
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-400
                                       group-hover:translate-x-0.5 transition-all" />
            </motion.div>
          </Link>
        </motion.div>
        {/* Powrót */}
        <motion.div variants={fadeUp} className="text-center mt-4">
          <Link
            href="/"
            className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            ← Wróć na stronę główną
          </Link>
        </motion.div>

      </motion.div>
    </div>
  )
}
