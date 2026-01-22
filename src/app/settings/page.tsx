import ProfileDropDown from "@/components/profileDropDown"
import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { redirect } from "next/navigation"
import { listUsersServer } from "@/server/actions/users-actions"
import SettingsManager from "./components/SettingsManager"

export default async function SettingsPage() {
  const session = await getServerSession(authConfig)

  if (!session?.user) {
    redirect("/")
  }

  const usersData = session.user.superUser
    ? await listUsersServer().catch(() => [])
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-4 sm:mb-2 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile and preferences</p>
        </div>
         <div className="hidden sm:flex justify-end ml-4 mb-8">
          <ProfileDropDown page="settings" />
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SettingsManager
          initialUsers={usersData}
          isSuperUser={!!session.user.superUser}
          currentUser={session.user}
        />
      </Suspense>
    </div>
  )
}
