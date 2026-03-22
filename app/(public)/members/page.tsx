import { getAllMembers } from '@/lib/supabase/queries'
import { MemberList } from '@/components/members/MemberList'

export const metadata = { title: 'Kierowcy' }
export const revalidate = 300

export default async function MembersPage() {
  const members = await getAllMembers()
  return (
    <div className="min-h-screen py-20 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-2">Nasi Kierowcy</h1>
        <p className="text-zinc-500">{members.length} aktywnych członków VTC</p>
      </div>
      <MemberList members={members} />
    </div>
  )
}
