'use client'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          classNames: {
            toast: 'bg-zinc-900 border border-zinc-700 text-white',
            description: 'text-zinc-400',
          },
        }}
      />
    </>
  )
}
