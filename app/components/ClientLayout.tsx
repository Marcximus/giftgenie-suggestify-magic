'use client'

import { Toaster } from '@/components/ui/toaster'
import { FloatingNav } from '@/components/FloatingNav'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingNav />
      <Toaster />
    </>
  )
}
