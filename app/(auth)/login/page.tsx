'use client'

import { useState, useEffect }         from 'react'
import { useRouter }                    from 'next/navigation'
import Link                             from 'next/link'
import { motion, AnimatePresence }      from 'framer-motion'
import type { Variants }                from 'framer-motion'
import { createClient }                 from '@/lib/supabase/client'
import { Button }                       from '@/components/ui/button'
import { toast }                        from 'sonner'
import {
  Truck, Mail, Lock, Eye, EyeOff,
  ChevronRight, Loader2, UserPlus,
  AlertCircle, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] },
  },
}
const container: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [remember,   setRemember]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [emailFocus, setEmailFocus] = useState(false)
  const [passFocus,  setPassFocus]  = useState(false)
  const [success,    setSuccess]    = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('vtc_remembered_email')
    if (saved) { setEmail(saved); setRemember(true) }
  }, [])

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

    if (remember) {
      localStorage.setItem('vtc_remembered_email', email.trim().toLowerCase())
    } else {
      localStorage.removeItem('vtc_remembered_email')
    }

    setSuccess(true)
    toast.success('Zalogowano! Przekierowuję do Huba...')
    setTimeout(() => { router.push('/hub'); router.refresh() }, 700)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Animated orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/4 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(245,158,11,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.4) 1px, transparent 1px)`,
        backgroundSize: '60px 60px', opacity: 0.04,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)',
      }} />

      <motion.div variants={container} initial="hidden" animate="visible" className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group mb-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.95 }}
              className="w-11 h-11 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 relative overflow-hidden"
            >
              <motion.div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Truck className="w-6 h-6 text-black relative z-10" />
            </motion.div>
            <span className="font-black text-2xl bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              GLos Logistics
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white">Witaj z powrotem</h1>
          <p className="text-sm text-zinc-500 mt-1">Zaloguj się do panelu kierowcy</p>
        </motion.div>

        {/* Formularz */}
        <motion.div variants={fadeUp} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Adres e-mail</label>
              <motion.div animate={{ scale: emailFocus ? 1.01 : 1 }} transition={{ duration: 0.15 }} className="relative">
                <motion.div
                  animate={{ color: emailFocus ? '#f59e0b' : '#52525b' }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <Mail className="w-4 h-4" />
                </motion.div>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  placeholder="kierowca@vtc.pl" required autoComplete="email"
                  disabled={loading || success}
                  className={cn(
                    'w-full bg-zinc-800/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 disabled:opacity-50',
                    emailFocus
                      ? 'border-amber-500/60 bg-zinc-800 shadow-[0_0_0_3px_rgba(245,158,11,0.08)]'
                      : error ? 'border-red-500/50' : 'border-zinc-700',
                  )}
                />
                {email && !error && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Hasło */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hasło</label>
                <Link href="/reset-password" className="text-[11px] text-zinc-600 hover:text-amber-400 transition-colors">
                  Zapomniałem hasła
                </Link>
              </div>
              <motion.div animate={{ scale: passFocus ? 1.01 : 1 }} transition={{ duration: 0.15 }} className="relative">
                <motion.div
                  animate={{ color: passFocus ? '#f59e0b' : '#52525b' }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <Lock className="w-4 h-4" />
                </motion.div>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  placeholder="••••••••" required autoComplete="current-password"
                  disabled={loading || success}
                  className={cn(
                    'w-full bg-zinc-800/60 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 disabled:opacity-50',
                    passFocus
                      ? 'border-amber-500/60 bg-zinc-800 shadow-[0_0_0_3px_rgba(245,158,11,0.08)]'
                      : error ? 'border-red-500/50' : 'border-zinc-700',
                  )}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showPass ? 'hide' : 'show'}
                      initial={{ opacity: 0, rotate: -10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </motion.div>
            </div>

            {/* Zapamiętaj mnie */}
            <motion.div whileHover={{ x: 2 }} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setRemember(v => !v)}>
              <div className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 shrink-0',
                remember ? 'bg-amber-500 border-amber-500 shadow-sm shadow-amber-500/30' : 'border-zinc-600 group-hover:border-zinc-500',
              )}>
                <AnimatePresence>
                  {remember && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15, type: 'spring', stiffness: 400 }}
                      viewBox="0 0 12 12" className="w-2.5 h-2.5"
                    >
                      <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </motion.svg>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors select-none">
                Zapamiętaj mój e-mail
              </span>
            </motion.div>

            {/* Błąd */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                disabled={loading || success || !email.trim() || !password}
                className={cn(
                  'w-full h-11 font-black text-sm gap-2 relative overflow-hidden group transition-all duration-300',
                  success
                    ? 'bg-green-500 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                )}
              >
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Przekierowuję...
                    </motion.span>
                  ) : loading ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Logowanie...
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                      <span className="relative z-10">Zaloguj się</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform relative z-10" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

          </form>
        </motion.div>

        {/* Rejestracja */}
        <motion.div variants={fadeUp} className="mt-3">
          <Link href="/register" className="block group">
            <motion.div
              whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
              className="bg-zinc-900/40 border border-zinc-800 group-hover:border-blue-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ rotate: 15 }} className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </motion.div>
                <div>
                  <p className="text-xs font-semibold text-zinc-300">Zarejestruj się</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Utwórz konto kierowcy</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center mt-4">
          <Link href="/" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">← Wróć na stronę główną</Link>
        </motion.div>

      </motion.div>
    </div>
  )
}