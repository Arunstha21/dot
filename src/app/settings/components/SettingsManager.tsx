"use client"

import { useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from 'next/dynamic'

// Dynamic imports for code splitting - loaded only when needed
const UsersManagement = dynamic(() => import("./UserManagement"), {
  loading: () => <div className="p-8">Loading user management...</div>
})
const UserProfile = dynamic(() => import("./UserProfile"), {
  loading: () => <div className="p-8">Loading profile...</div>
})

type User = {
  name?: string | null
  email?: string | null
  superUser?: boolean
}

type UsersData = any[]

export default function SettingsManager({
  initialUsers,
  isSuperUser,
  currentUser,
}: {
  initialUsers: UsersData
  isSuperUser: boolean
  currentUser: User
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Get initial tab from URL or default to "profile"
  const currentTab = searchParams.get("tab") || "profile"

  // Handle tab change - update URL without full page reload
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "profile") {
      params.delete("tab") // Keep URL clean for default tab
    } else {
      params.set("tab", value)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="flex gap-2 w-full sm:w-auto">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        {isSuperUser && <TabsTrigger value="users">Users</TabsTrigger>}
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="mt-6">
        <UserProfile user={currentUser} />
      </TabsContent>

      {/* Users Tab (SuperUser only) */}
      {isSuperUser && (
        <TabsContent value="users" className="mt-6">
          <UsersManagement initialUsers={initialUsers} />
        </TabsContent>
      )}
    </Tabs>
  )
}
