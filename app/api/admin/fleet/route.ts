import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminSupabase = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Weryfikuj czy wywołujący to Manager/Owner
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('members')
    .select('rank')
    .eq('id', user.id)
    .single()

  if (!member || !['Manager', 'Owner'].includes(member.rank)) return null
  return user
}

// POST – dodaj pojazd
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const { data, error } = await adminSupabase
    .from('fleet')
    .insert({
      name:        body.name,
      brand:       body.brand,
      model:       body.model    || null,
      assigned_to: body.assigned_to === 'UNASSIGNED' ? null : (body.assigned_to || null),
      image_urls:  body.image_urls ?? [],
    })
    .select('*, members(username, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH – aktualizuj pojazd (np. zmień kierowcę)
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Konwertuj UNASSIGNED → null
  if (updates.assigned_to === 'UNASSIGNED') updates.assigned_to = null

  const { data, error } = await adminSupabase
    .from('fleet')
    .update(updates)
    .eq('id', id)
    .select('*, members(username, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE – usuń pojazd
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await adminSupabase
    .from('fleet')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
