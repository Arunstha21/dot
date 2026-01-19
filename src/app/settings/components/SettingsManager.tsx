"use client"

import { useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from 'next/dynamic'

// Dynamic imports for code splitting - loaded only when needed (~300KB savings)
const EventsManagement = dynamic(() => import("./EventsManagement").then(m => ({ default: m.default })), {
  loading: () => <div className="p-8">Loading events management...</div>
})
const TeamsPlayersManagement = dynamic(() => import("./TeamPlayerManagement"), {
  loading: () => <div className="p-8">Loading teams & players...</div>
})
const MatchesManagement = dynamic(() => import("./MatchesManagement"), {
  loading: () => <div className="p-8">Loading matches...</div>
})
const DiscordManagement = dynamic(() => import("./DiscordManagement"), {
  loading: () => <div className="p-8">Loading discord settings...</div>
})
const UsersManagement = dynamic(() => import("./UserManagement"), {
  loading: () => <div className="p-8">Loading user management...</div>
})
const UserProfile = dynamic(() => import("./UserProfile"), {
  loading: () => <div className="p-8">Loading profile...</div>
})
const EventStageGroupSelector = dynamic(() => import("./EventStageGroupSelector"), {
  loading: () => <div className="p-8">Loading selector...</div>
})

// Import types that were removed with default imports
import type { EventsData } from "./EventsManagement"

type User = {
  name?: string | null
  email?: string | null
  superUser?: boolean
}

type UsersData = any[]

interface Selection {
  eventId: string
  stageId: string
  groupId: string
  eventName: string
  stageName: string
  groupName: string
}

export default function SettingsManager({
  initialEvents,
  initialUsers,
  isSuperUser,
  currentUser,
  availablePointSystems
}: {
  initialEvents: EventsData[]
  initialUsers: UsersData
  isSuperUser: boolean
  currentUser: User
  availablePointSystems: { id: string; name: string }[]
}) {

  const [selection, setSelection] = useState<Selection>({
    eventId: "",
    stageId: "",
    groupId: "",
    eventName: "",
    stageName: "",
    groupName: "",
  })

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
      <TabsList className="flex flex-wrap gap-2 w-full lg:grid lg:grid-cols-6">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="teams-players">Teams & Players</TabsTrigger>
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="discord">Discord</TabsTrigger>
        {isSuperUser && <TabsTrigger value="users">Users</TabsTrigger>}
      </TabsList>


      {/* Profile Tab */}
      <TabsContent value="profile" className="mt-6">
        <UserProfile user={currentUser} />
      </TabsContent>

      {/* Events Tab */}
      <TabsContent value="events" className="mt-6">
        <EventsManagement initialData={initialEvents} availablePointSystems={availablePointSystems} />
      </TabsContent>

      {/* Users Tab (SuperUser only) */}
      {isSuperUser && (
        <TabsContent value="users" className="mt-6">
          <UsersManagement initialUsers={initialUsers} />
        </TabsContent>
      )}

      {/* Teams & Players Tab */}
      <TabsContent value="teams-players" className="mt-6 space-y-6">
        <EventStageGroupSelector
          onSelectionChange={setSelection}
          selectedEvent={selection.eventId}
          selectedStage={selection.stageId}
          selectedGroup={selection.groupId}
        />
        {selection.groupId && (
          <TeamsPlayersManagement
            selectedGroup={selection.groupId}
            groupName={selection.groupName}
          />
        )}
      </TabsContent>

      {/* Matches Tab */}
      <TabsContent value="matches" className="mt-6 space-y-6">
        <EventStageGroupSelector
          onSelectionChange={setSelection}
          selectedEvent={selection.eventId}
          selectedStage={selection.stageId}
          selectedGroup={selection.groupId}
        />
        {selection.groupId && (
          <MatchesManagement
            selectedGroup={selection.groupId}
            groupName={selection.groupName}
          />
        )}
      </TabsContent>

      {/* Discord Tab */}
      <TabsContent value="discord" className="mt-6 space-y-6">
        <EventStageGroupSelector
          onSelectionChange={setSelection}
          selectedEvent={selection.eventId}
          selectedStage={selection.stageId}
          selectedGroup={selection.groupId}
        />
        {selection.eventId && selection.stageId && (
          <DiscordManagement
            eventName={selection.eventName}
            stageName={selection.stageName}
            stageId={selection.stageId}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
