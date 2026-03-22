import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }) }

  const apiKey = (body as any)?.api_key?.trim()

  if (!apiKey || !/^[0-9a-f-]{36}$/.test(apiKey)) {
    return NextResponse.json(
      { ok: false, error: 'Nieprawidłowy format klucza API' },
      { status: 422 }
    )
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, username, rank, is_banned')
    .eq('api_key', apiKey)
    .maybeSingle()

  if (!member) {
    return NextResponse.json(
      { ok: false, error: 'Nie znaleziono konta z tym kluczem API' },
      { status: 401 }
    )
  }

  if (member.is_banned) {
    return NextResponse.json(
      { ok: false, error: 'Konto jest zbanowane' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    ok:       true,
    username: member.username,
    rank:     member.rank,
    message:  `Klucz zweryfikowany — witaj, ${member.username}!`,
  })
}
