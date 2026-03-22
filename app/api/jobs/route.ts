import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminSupabase = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Sprawdź czy jest memberem
  const { data: member } = await supabase
    .from('members').select('id').eq('id', user.id).single()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const { data, error } = await adminSupabase
    .from('jobs')
    .insert({ ...body, created_by: user.id, status: 'open' })
    .select(`
      *,
      creator:created_by ( id, username, avatar_url, rank ),
      taker:taken_by     ( id, username, avatar_url )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
