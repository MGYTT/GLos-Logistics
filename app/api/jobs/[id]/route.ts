import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminSupabase = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Sprawdź czy user jest memberem
  const { data: member } = await supabase
    .from('members')
    .select('id, rank')
    .eq('id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Pobierz aktualne zlecenie
  const { data: job } = await adminSupabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const isAdmin   = ['Manager', 'Owner'].includes(member.rank)
  const isCreator = job.created_by === user.id
  const isTaker   = job.taken_by   === user.id

  // Sprawdź uprawnienia per akcja
  const updates = await req.json()
  const action  = updates._action
  delete updates._action

  const allowed =
    isAdmin ||
    isCreator ||
    isTaker   ||
    (action === 'take' && job.status === 'open' && job.created_by !== user.id)

  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Wykonaj update
  const { data, error } = await adminSupabase
    .from('jobs')
    .update(updates)
    .eq('id', params.id)
    .select(`
      *,
      creator:created_by ( id, username, avatar_url, rank ),
      taker:taken_by     ( id, username, avatar_url )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('members').select('rank').eq('id', user.id).single()

  const isAdmin = ['Manager', 'Owner'].includes(member?.rank ?? '')
  const { data: job } = await adminSupabase
    .from('jobs').select('created_by').eq('id', params.id).single()

  if (!isAdmin && job?.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await adminSupabase.from('jobs').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
