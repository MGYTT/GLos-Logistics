'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Member } from '@/types'

export function useMember(userId?: string) {
  const [member, setMember]   = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    supabase
      .from('members')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setMember(data)
        setLoading(false)
      })
  }, [userId])

  return { member, loading }
}
