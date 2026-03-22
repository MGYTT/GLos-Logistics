'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Truck, User, Mail, Lock, Eye, EyeOff,
  ChevronRight, Loader2, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}

const container = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

// Walidacja siły hasła
function getPasswordStrength(p: string): { score: number; label: string; color: string } {
  if (p.length === 0)  return { score: 0, label: '',        color: ''                  }
  if (p.length < 6)    return { score: 1, label: 'Słabe',   color: 'bg-red-500'        }
  if (p.length < 8)    return { score: 2, label: 'Słabe',   color: 'bg-red-500'        }
  const hasUpper  = /[A-Z]/.test(p)
  const hasNumber = /[0-9]/.test(p)
  const hasSymbol = /[^A-Za-z0-9]/.test(p)
  const extras    = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length
  if (extras === 0) return { score: 2, label: 'Słabe',    color: 'bg-red-500'    }
  if (extras === 1) return { score: 3, label: 'Średnie',  color: 'bg-amber-500'  }
  if (extras === 2) return { score: 4, label: 'Dobre',    color: 'bg-blue-500'   }
  return              { score: 5, label: 'Silne',     color: 'bg-green-500'  }
}

interface FormState {
  username: string
  email:    string
  password: string
}

interface FieldErrors {
  username?: string
  email?:    string
  password?: string
}

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [form, setForm]       = useState<FormState>({ username: '', email: '', password: '' })
  const [errors, setErrors]   = useState<FieldErrors>({})
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const strength = getPasswordStrength(form.password)

  function setField(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }))
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  function validate(): boolean {
    const errs: FieldErrors = {}

    if (form.username.trim().length < 3)
      errs.username = 'Nick musi mieć min. 3 znaki.'
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(form.username.trim()))
      errs.username = 'Nick zawiera niedozwolone znaki.'
    if (!form.email.includes('@'))
      errs.email = 'Podaj prawidłowy adres e-mail.'
    if (form.password.length < 8)
      errs.password = 'Hasło musi mieć min. 8 znaków.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    // Sprawdź czy nick jest wolny
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .ilike('username', form.username.trim())
      .maybeSingle()

    if (existing) {
      setErrors({ username: 'Ten nick jest już zajęty.' })
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      options:  { data: { username: form.username.trim() } },
    })

    if (signUpError) {
      const msg = signUpError.message.includes('already registered')
        ? 'Ten adres e-mail jest już zarejestrowany.'
        : signUpError.message.includes('Password')
        ? 'Hasło jest zbyt słabe.'
        : 'Wystąpił błąd. Spróbuj ponownie.'
      toast.error(msg)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('members').insert({
        id:       data.user.id,
        username: form.username.trim(),
        rank:     'Recruit',
        points:   0,
      })
    }

    setLoading(false)
    setDone(true)
  }

  // ── Stan po rejestracji ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/4 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </motion.div>

          <h1 className="text-2xl font-black text-white mb-2">Konto utworzone!</h1>
          <p className="text-zinc-400 text-sm mb-2 leading-relaxed">
            Wysłaliśmy link potwierdzający na adres:
          </p>
          <p className="text-amber-400 font-semibold text-sm mb-6">{form.email}</p>
          <p className="text-zinc-500 text-xs mb-8 leading-relaxed">
            Sprawdź skrzynkę (i folder spam). Po potwierdzeniu możesz się zalogować.
          </p>

          <Link href="/login">
            <Button className="bg-amber-500 hover:bg-amber-400 text-black font-black gap-2 w-full h-11">
              Przejdź do logowania
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  // ── Formularz ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Tło */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/4 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-600/4 rounded-full blur-[100px] pointer-events-none" />
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
              className="w-11 h-11 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <Truck className="w-6 h-6 text-black" />
            </motion.div>
            <span className="font-black text-2xl bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              GLos Logistics
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white">Utwórz konto</h1>
          <p className="text-sm text-zinc-500 mt-1">Dołącz do VTC Hub jako kierowca</p>
        </motion.div>

        {/* Formularz */}
        <motion.div
          variants={fadeUp}
          className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6"
        >
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Nick */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Nick w grze
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type="text"
                  value={form.username}
                  onChange={setField('username')}
                  placeholder="TwójNick123"
                  required
                  minLength={3}
                  maxLength={32}
                  autoComplete="username"
                  disabled={loading}
                  className={cn(
                    'w-full bg-zinc-800/60 border border-zinc-700 rounded-xl',
                    'pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600',
                    'outline-none transition-all duration-200',
                    'focus:border-amber-500/60 focus:bg-zinc-800',
                    'disabled:opacity-50',
                    errors.username && 'border-red-500/50',
                  )}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-400 px-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Adres e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={setField('email')}
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
                    errors.email && 'border-red-500/50',
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 px-1">{errors.email}</p>
              )}
            </div>

            {/* Hasło */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="Min. 8 znaków"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  className={cn(
                    'w-full bg-zinc-800/60 border border-zinc-700 rounded-xl',
                    'pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600',
                    'outline-none transition-all duration-200',
                    'focus:border-amber-500/60 focus:bg-zinc-800',
                    'disabled:opacity-50',
                    errors.password && 'border-red-500/50',
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPass
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye    className="w-4 h-4" />
                  }
                </button>
              </div>

              {/* Siła hasła */}
              {form.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5 px-1"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 h-1 rounded-full transition-all duration-300',
                          i <= strength.score ? strength.color : 'bg-zinc-800',
                        )}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={cn(
                      'text-[10px] font-semibold',
                      strength.color === 'bg-red-500'   && 'text-red-400',
                      strength.color === 'bg-amber-500' && 'text-amber-400',
                      strength.color === 'bg-blue-500'  && 'text-blue-400',
                      strength.color === 'bg-green-500' && 'text-green-400',
                    )}>
                      Siła hasła: {strength.label}
                    </p>
                  )}
                </motion.div>
              )}

              {errors.password && (
                <p className="text-xs text-red-400 px-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !form.username || !form.email || !form.password}
              className={cn(
                'w-full h-11 font-black text-sm gap-2 mt-2 relative overflow-hidden group',
                'bg-amber-500 hover:bg-amber-400 text-black',
                'shadow-lg shadow-amber-500/20 transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Tworzenie konta...
                </>
              ) : (
                <>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  Utwórz konto
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>

          </form>
        </motion.div>

        {/* Link do logowania */}
        <motion.div variants={fadeUp} className="mt-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Masz już konto?
            </p>
            <Link href="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:border-amber-500/30 hover:text-amber-400 gap-1.5 h-8 text-xs"
                >
                  Zaloguj się
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </motion.div>
            </Link>
          </div>
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
