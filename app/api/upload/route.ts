import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file     = formData.get('file') as File
  const folder   = (formData.get('folder') as string) ?? 'misc'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext  = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('fleet')
    .upload(path, buffer, { contentType: file.type, cacheControl: '3600' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from('fleet').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
