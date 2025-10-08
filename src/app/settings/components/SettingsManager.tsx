"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EventsManagement, { EventsData } from "./EventsManagement"
import MatchesManagement from "./MatchesManagement"
import DiscordManagement from "./DiscordManagement"
import UserProfile from "./UserProfile"
import EventStageGroupSelector from "./EventStageGroupSelector"
import TeamsPlayersManagement from "./TeamPlayerManagement"
import UsersManagement from "./UserManagement"

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

  return (
    <Tabs defaultValue="profile" className="w-full">
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
