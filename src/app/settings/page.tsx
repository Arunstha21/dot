import ProfileDropDown from "@/components/profileDropDown"
import { Suspense } from "react"
import { listAllHierarchy } from "@/server/actions/events-actions"
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

  const [eventsData, usersData] = await Promise.all([
    listAllHierarchy(),
    session.user.superUser ? listUsersServer().catch(() => []) : Promise.resolve([]),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-4 sm:mb-2 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings & Management</h1>
          <p className="text-muted-foreground mt-2">Manage and update all system records from this central hub</p>
        </div>
         <div className="hidden sm:flex justify-end ml-4 mb-8">
          <ProfileDropDown page="settings" />
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SettingsManager
          initialEvents={eventsData}
          initialUsers={usersData}
          isSuperUser={!!session.user.superUser}
          currentUser={session.user}
        />
      </Suspense>
    </div>
    </div>
  )
}
