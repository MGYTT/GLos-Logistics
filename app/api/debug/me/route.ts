import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not logged in' })

  const [{ data: member }, { data: application }] = await Promise.all([
    supabase.from('members').select('rank, is_banned').eq('id', user.id).single(),
    supabase.from('applications').select('status').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).single(),
  ])

  return NextResponse.json({
    userId:    user.id,
    email:     user.email,
    member,
    application,
    isAdmin:   ['Manager', 'Owner'].includes(member?.rank ?? ''),
  })
}
