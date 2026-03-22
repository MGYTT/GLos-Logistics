'use server'

import { createClient }           from '@/lib/supabase/server'
import { revalidatePath }         from 'next/cache'
import { redirect }               from 'next/navigation'
import { sendNewsWebhook }        from '@/lib/discord/webhooks'

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('Nie jesteś zalogowany')

  const { data: member } = await supabase
    .from('members')
    .select('rank, username')
    .eq('id', user.id)
    .single()

  if (member?.rank !== 'Owner') throw new Error('Brak uprawnień — wymagana ranga Owner')

  return { supabase, userId: user.id, username: member.username }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ą/g, 'a').replace(/ę/g, 'e').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ł/g, 'l').replace(/ż/g, 'z')
    .replace(/ź/g, 'z').replace(/ć/g, 'c').replace(/ń/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function upsertPost(formData: FormData) {
  const { supabase, userId } = await requireOwner()

  const id       = formData.get('id')         as string | null
  const title    = (formData.get('title')     as string).trim()
  const excerpt  = (formData.get('excerpt')   as string).trim()
  const content  = (formData.get('content')   as string).trim()
  const category = (formData.get('category')  as string).trim()
  const readTime = (formData.get('read_time') as string).trim()
  const coverUrl = (formData.get('cover_url') as string | null)?.trim() || null
  const rawSlug  = (formData.get('slug')      as string | null)?.trim()
  const slug     = rawSlug ? slugify(rawSlug) : slugify(title)

  if (!title || !excerpt || !content || !slug) {
    throw new Error('Wypełnij wszystkie wymagane pola')
  }

  const payload = {
    slug, title, excerpt, content, category,
    read_time: readTime || '2 min',
    cover_url: coverUrl,
    author_id: userId,
  }

  if (id) {
    const { error } = await supabase.from('news_posts').update(payload).eq('id', id)
    if (error) throw new Error(`Błąd aktualizacji: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('news_posts')
      .insert({ ...payload, published: false, featured: false })
    if (error) {
      if (error.code === '23505') throw new Error('Post z tym slugiem już istnieje')
      throw new Error(`Błąd tworzenia: ${error.message}`)
    }
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
  redirect('/admin/news')
}

export async function togglePublish(id: string, published: boolean) {
  const { supabase, username } = await requireOwner()

  const { error } = await supabase
    .from('news_posts')
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) throw new Error(`Błąd: ${error.message}`)

  // ── Discord webhook — tylko przy publikacji ──
  if (published) {
    const { data: post } = await supabase
      .from('news_posts')
      .select('title, slug, excerpt, featured')
      .eq('id', id)
      .single()

    if (post) {
      await sendNewsWebhook({
        title:    post.title,
        slug:     post.slug,
        excerpt:  post.excerpt ?? undefined,
        author:   username,
        featured: post.featured ?? false,
      })
    }
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

export async function toggleFeatured(id: string, featured: boolean) {
  const { supabase } = await requireOwner()

  if (featured) {
    await supabase.from('news_posts').update({ featured: false }).neq('id', id)
  }

  const { error } = await supabase
    .from('news_posts').update({ featured }).eq('id', id)

  if (error) throw new Error(`Błąd: ${error.message}`)

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

export async function deletePost(id: string) {
  const { supabase } = await requireOwner()

  const { error } = await supabase.from('news_posts').delete().eq('id', id)
  if (error) throw new Error(`Błąd usuwania: ${error.message}`)

  revalidatePath('/admin/news')
  revalidatePath('/news')
  redirect('/admin/news')
}
