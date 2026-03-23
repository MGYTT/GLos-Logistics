import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateWeeklyLeavePay } from '@/lib/vtc/payCalculator'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Uruchom standardowe bonusy tygodniowe
    const { data: bonusResult, error: bonusErr } = await supabase
      .rpc('run_weekly_bonuses')
    if (bonusErr) throw bonusErr

    // 2. Rozlicz urlopy — zakończ przeterminowane
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('member_leaves')
      .update({ status: 'ended' })
      .eq('status', 'approved')
      .lt('end_date', today)

    // 3. Aktywuj zatwierdzone które się zaczęły
    await supabase
      .from('member_leaves')
      .update({ status: 'active' })
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today)

    // 4. Pobierz aktywne urlopy płatne i L4 — wypłać proporcjonalnie
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const { data: activeLeaves } = await supabase
      .from('member_leaves')
      .select('member_id, type, start_date, end_date')
      .in('type', ['paid', 'sick'])
      .in('status', ['approved', 'active', 'ended'])
      .gte('end_date', weekStart)

    const leavePayouts: { member_id: string; amount: number; type: string }[] = []

    for (const leave of activeLeaves ?? []) {
      // Oblicz ile dni urlopu wypada w tym tygodniu
      const leaveStart = new Date(Math.max(
        new Date(leave.start_date).getTime(),
        new Date(weekStart).getTime(),
      ))
      const leaveEnd = new Date(Math.min(
        new Date(leave.end_date).getTime(),
        new Date(today).getTime(),
      ))
      const leaveDaysThisWeek =
        Math.max(0, Math.floor((leaveEnd.getTime() - leaveStart.getTime()) / 86400000) + 1)

      if (leaveDaysThisWeek === 0) continue

      // Bazowa tygodniowa stawka urlopowa = 2000 VTC€
      const BASE_LEAVE_PAY = 2000
      const result = calculateWeeklyLeavePay({
        base_weekly_pay: BASE_LEAVE_PAY,
        leave_type:      leave.type as 'paid' | 'sick',
        leave_days:      leaveDaysThisWeek,
      })

      if (result.gross > 0) {
        leavePayouts.push({
          member_id: leave.member_id,
          amount:    result.gross,
          type:      leave.type === 'paid' ? 'paid_leave_pay' : 'sick_leave_pay',
        })
      }
    }

    // 5. Wypłać urlopy — zbiorczy upsert do wallet_transactions
    for (const payout of leavePayouts) {
      await supabase.rpc('credit_wallet', {
        p_member_id:  payout.member_id,
        p_amount:     payout.amount,
        p_type:       payout.type,
        p_description: payout.type === 'paid_leave_pay'
          ? 'Wypłata urlopu płatnego'
          : 'Wypłata L4 (80%)',
      })
    }

    console.log(`[Cron] weekly_bonuses OK | leave_payouts: ${leavePayouts.length}`)
    return NextResponse.json({
      ok:            true,
      bonus_result:  bonusResult,
      leave_payouts: leavePayouts.length,
    })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Cron] weekly_bonuses error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
