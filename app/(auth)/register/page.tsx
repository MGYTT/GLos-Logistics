'use client'

import { useState }                    from 'react'
import { createClient }                from '@/lib/supabase/client'
import { useRouter }                   from 'next/navigation'
import { motion, AnimatePresence }     from 'framer-motion'
import { Button }                      from '@/components/ui/button'
import type { Variants }               from 'framer-motion'
import { toast }                       from 'sonner'
import Link                            from 'next/link'
import {
  Truck, User, Mail, Lock, Eye, EyeOff,
  ChevronRight, Loader2, CheckCircle2,
  AlertCircle, Sparkles,
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

function getPasswordStrength(p: string) {
  if (p.length === 0) return { score: 0, label: '',        color: '',             textColor: ''               }
  if (p.length < 6)   return { score: 1, label: 'Słabe',   color: 'bg-red-500',   textColor: 'text-red-400'   }
  if (p.length < 8)   return { score: 2, label: 'Słabe',   color: 'bg-red-500',   textColor: 'text-red-400'   }
  const extras = [/[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length
  if (extras === 0) return { score: 2, label: 'Słabe',   color: 'bg-red-500',   textColor: 'text-red-400'   }
  if (extras === 1) return { score: 3, label: 'Średnie', color: 'bg-amber-500', textColor: 'text-amber-400' }
  if (extras === 2) return { score: 4, label: 'Dobre',   color: 'bg-blue-500',  textColor: 'text-blue-400'  }
  return              { score: 5, label: 'Silne',    color: 'bg-green-500', textColor: 'text-green-400' }
}

interface FormState   { username: string; email: string; password: string }
interface FieldErrors { username?: string; email?: string; password?: string }

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [form,     setForm]     = useState<FormState>({ username: '', email: '', password: '' })
  const [errors,   setErrors]   = useState<FieldErrors>({})
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [focus,    setFocus]    = useState<string | null>(null)

  const strength = getPasswordStrength(form.password)

  function setField(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }))
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  function validate(): boolean {
    const errs: FieldErrors = {}
    if (form.username.trim().length < 3)                      errs.username = 'Nick musi mieć min. 3 znaki.'
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(form.username.trim()))   errs.username = 'Nick zawiera niedozwolone znaki.'
    if (!form.email.includes('@'))                            errs.email    = 'Podaj prawidłowy adres e-mail.'
    if (form.password.length < 8)                             errs.password = 'Hasło musi mieć min. 8 znaków.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const { data: existing } = await supabase
      .from('members').select('id').ilike('username', form.username.trim()).maybeSingle()

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
      toast.error(
        signUpError.message.includes('already registered') ? 'Ten adres e-mail jest już zarejestrowany.'
        : signUpError.message.includes('Password')         ? 'Hasło jest zbyt słabe.'
        : 'Wystąpił błąd. Spróbuj ponownie.'
      )
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('members').insert({
        id: data.user.id, username: form.username.trim(), rank: 'Recruit', points: 0,
      })
    }

    setLoading(false)
    setDone(true)
  }

  // ── Sukces ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500 rounded-full blur-[140px] pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
          className="w-full max-w-sm text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border border-green-500/30"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h1 className="text-2xl font-black text-white mb-2">Konto utworzone!</h1>
            <p className="text-zinc-400 text-sm mb-2 leading-relaxed">Wysłaliśmy link potwierdzający na:</p>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 mb-6">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">{form.email}</span>
            </div>
            <p className="text-zinc-600 text-xs mb-8 leading-relaxed">Sprawdź skrzynkę (i folder spam). Po potwierdzeniu możesz się zalogować.</p>
            <Link href="/login">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="bg-amber-500 hover:bg-amber-400 text-black font-black gap-2 w-full h-11 relative overflow-hidden group shadow-lg shadow-amber-500/20">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <span className="relative z-10">Przejdź do logowania</span>
                  <ChevronRight className="w-4 h-4 relative z-10" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // ── Formularz ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <motion.div
        animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -18, 0], y: [0, 20, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-orange-600/4 rounded-full blur-[100px] pointer-events-none"
      />
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(245,158,11,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.4) 1px, transparent 1px)`,
        backgroundSize: '60px 60px', opacity: 0.04,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)',
      }} />

      <motion.div variants={container} initial="hidden" animate="visible" className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group mb-6">
            <motion.div whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.95 }}
              className="w-11 h-11 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 relative overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Truck className="w-6 h-6 text-black relative z-10" />
            </motion.div>
            <span className="font-black text-2xl bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">GLos Logistics</span>
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </motion.div>
            <h1 className="text-2xl font-black text-white">Utwórz konto</h1>
          </div>
          <p className="text-sm text-zinc-500">Dołącz do VTC Hub jako kierowca</p>
        </motion.div>

        {/* Formularz */}
        <motion.div variants={fadeUp} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Nick */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nick w grze</label>
              <motion.div animate={{ scale: focus === 'username' ? 1.01 : 1 }} transition={{ duration: 0.15 }} className="relative">
                <motion.div animate={{ color: focus === 'username' ? '#f59e0b' : '#52525b' }} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className="w-4 h-4" />
                </motion.div>
                <input
                  type="text" value={form.username} onChange={setField('username')}
                  onFocus={() => setFocus('username')} onBlur={() => setFocus(null)}
                  placeholder="TwójNick123" required minLength={3} maxLength={32} autoComplete="username" disabled={loading}
                  className={cn(
                    'w-full bg-zinc-800/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 disabled:opacity-50',
                    focus === 'username' ? 'border-amber-500/60 bg-zinc-800 shadow-[0_0_0_3px_rgba(245,158,11,0.08)]'
                      : errors.username ? 'border-red-500/50' : 'border-zinc-700',
                  )}
                />
              </motion.div>
              <AnimatePresence>
                {errors.username && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 flex items-center gap-1.5 px-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />{errors.username}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Adres e-mail</label>
              <motion.div animate={{ scale: focus === 'email' ? 1.01 : 1 }} transition={{ duration: 0.15 }} className="relative">
                <motion.div animate={{ color: focus === 'email' ? '#f59e0b' : '#52525b' }} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </motion.div>
                <input
                  type="email" value={form.email} onChange={setField('email')}
                  onFocus={() => setFocus('email')} onBlur={() => setFocus(null)}
                  placeholder="kierowca@vtc.pl" required autoComplete="email" disabled={loading}
                  className={cn(
                    'w-full bg-zinc-800/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 disabled:opacity-50',
                    focus === 'email' ? 'border-amber-500/60 bg-zinc-800 shadow-[0_0_0_3px_rgba(245,158,11,0.08)]'
                      : errors.email ? 'border-red-500/50' : 'border-zinc-700',
                  )}
                />
              </motion.div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 flex items-center gap-1.5 px-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />{errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Hasło */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Hasło</label>
              <motion.div animate={{ scale: focus === 'password' ? 1.01 : 1 }} transition={{ duration: 0.15 }} className="relative">
                <motion.div animate={{ color: focus === 'password' ? '#f59e0b' : '#52525b' }} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </motion.div>
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={setField('password')}
                  onFocus={() => setFocus('password')} onBlur={() => setFocus(null)}
                  placeholder="Min. 8 znaków" required minLength={8} autoComplete="new-password" disabled={loading}
                  className={cn(
                    'w-full bg-zinc-800/60 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 disabled:opacity-50',
                    focus === 'password' ? 'border-amber-500/60 bg-zinc-800 shadow-[0_0_0_3px_rgba(245,158,11,0.08)]'
                      : errors.password ? 'border-red-500/50' : 'border-zinc-700',
                  )}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={showPass ? 'hide' : 'show'} initial={{ opacity: 0, rotate: -10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 10 }} transition={{ duration: 0.15 }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </motion.div>

              <AnimatePresence>
                {form.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 px-1 overflow-hidden">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <motion.div key={i} animate={{ opacity: i <= strength.score ? 1 : 0.25 }} transition={{ duration: 0.2 }}
                          className={cn('flex-1 h-1 rounded-full transition-all duration-300', i <= strength.score ? strength.color : 'bg-zinc-800')} />
                      ))}
                    </div>
                    {strength.label && <p className={cn('text-[10px] font-semibold', strength.textColor)}>Siła hasła: {strength.label}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 flex items-center gap-1.5 px-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />{errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit" disabled={loading || !form.username || !form.email || !form.password}
                className="w-full h-11 font-black text-sm gap-2 mt-2 relative overflow-hidden group bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />Tworzenie konta...
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                      <span className="relative z-10">Utwórz konto</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform relative z-10" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

          </form>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">Masz już konto?</p>
            <Link href="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:border-amber-500/30 hover:text-amber-400 gap-1.5 h-8 text-xs transition-all">
                  Zaloguj się <ChevronRight className="w-3 h-3" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center mt-4">
          <Link href="/" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">← Wróć na stronę główną</Link>
        </motion.div>

      </motion.div>
    </div>
  )
}