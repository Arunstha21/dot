"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

export function AuthSessionProvider({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
