"use client"

import React, { use, Suspense } from "react"
import { Loader2 } from "lucide-react"
import EventStageGroupSelector from "@/components/shared/EventStageGroupSelector"
import { useEventSelection } from "@/contexts"

type ViewKey = "compose-new" | "compose-event" | "import-data" | "results" | "events" | "teams" | "matches" | "discord" | "role-manager" | "gac"

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function DashboardView({
  params,
}: {
  params: Promise<{ view: string }>
}) {
  const { view } = use(params)
  const viewKey = view as ViewKey
  const { selection, setSelection } = useEventSelection()

  // These views need the EventStageGroupSelector
  const needsSelector = ["teams", "matches", "discord", "role-manager", "gac"].includes(viewKey)

  if (needsSelector) {
    return (
      <div className="p-6 space-y-6">
        <EventStageGroupSelector
          onSelectionChange={setSelection}
          selectedEvent={selection.eventId}
          selectedStage={selection.stageId}
          selectedGroup={selection.groupId}
        />
        {((selection.groupId) || (selection.eventId && selection.stageId)) && (
          <div>
            {viewKey === "teams" && selection.groupId && (
              <TeamsManagementLoader
                selectedGroup={selection.groupId}
                groupName={selection.groupName}
              />
            )}
            {viewKey === "matches" && selection.groupId && (
              <MatchesManagementLoader
                selectedGroup={selection.groupId}
                groupName={selection.groupName}
              />
            )}
            {viewKey === "discord" && selection.eventId && selection.stageId && (
              <DiscordIntegrationLoader
                eventName={selection.eventName}
                stageName={selection.stageName}
                stageId={selection.stageId}
              />
            )}
            {viewKey === "role-manager" && selection.stageId && (
              <RoleManagerLoader
                stageId={selection.stageId}
                stageName={selection.stageName}
              />
            )}
            {viewKey === "gac" && selection.stageId && (
              <GACLoader
                stageId={selection.stageId}
                stageName={selection.stageName}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return <ViewRenderer viewKey={viewKey} />
}

// Helper components for dynamic loading with props
function TeamsManagementLoader({ selectedGroup, groupName }: { selectedGroup: string; groupName: string }) {
  const Component = require("@/components/dashboard/management/teams/TeamsManagement").default
  return <Component selectedGroup={selectedGroup} groupName={groupName} />
}

function MatchesManagementLoader({ selectedGroup, groupName }: { selectedGroup: string; groupName: string }) {
  const Component = require("@/components/dashboard/management/matches/MatchesManagement").default
  return <Component selectedGroup={selectedGroup} groupName={groupName} />
}

function DiscordIntegrationLoader({ eventName, stageName, stageId }: { eventName: string; stageName: string; stageId: string }) {
  const Component = require("@/components/dashboard/management/discord/DiscordIntegration").default
  return <Component eventName={eventName} stageName={stageName} stageId={stageId} />
}

function RoleManagerLoader({ stageId, stageName }: { stageId: string; stageName: string }) {
  const Component = require("@/components/dashboard/role-manager/RoleManagerPage").default
  return <Component stageId={stageId} stageName={stageName} />
}

function GACLoader({ stageId, stageName }: { stageId: string; stageName: string }) {
  const Component = require("@/components/dashboard/gac/GACPage").default
  return <Component stageId={stageId} stageName={stageName} />
}

// Renderer for views without selector
function ViewRenderer({ viewKey }: { viewKey: ViewKey }) {
  const Component = ViewComponents[viewKey]

  return (
    <div className="p-6">
      <Suspense fallback={<LoadingSpinner />}>
        <Component />
      </Suspense>
    </div>
  )
}

// Dynamic components using React.lazy
const ViewComponents: Record<ViewKey, React.LazyExoticComponent<React.ComponentType<any>>> = {
  "compose-new": React.lazy(() => import("@/components/dashboard/actions/compose").then(m => ({ default: m.ComposeNewPage }))),
  "compose-event": React.lazy(() => import("@/components/dashboard/actions/compose").then(m => ({ default: m.ComposeEventPage }))),
  "import-data": React.lazy(() => import("@/components/dashboard/actions/import").then(m => ({ default: m.ImportDataPage }))),
  "results": React.lazy(() => import("@/components/dashboard/actions/results").then(m => ({ default: m.ResultsPage }))),
  "events": React.lazy(() => import("@/components/dashboard/management/events/EventsManagement").then(m => ({ default: m.default }))),
  "teams": React.lazy(() => import("@/components/dashboard/management/teams/TeamsManagement").then(m => ({ default: m.default }))),
  "matches": React.lazy(() => import("@/components/dashboard/management/matches/MatchesManagement").then(m => ({ default: m.default }))),
  "discord": React.lazy(() => import("@/components/dashboard/management/discord/DiscordIntegration").then(m => ({ default: m.default }))),
  // These use the selector pattern, so these are stubs to satisfy TypeScript
  "role-manager": React.lazy(() => import("@/components/dashboard/role-manager/RoleManagerPage").then(m => ({ default: m.default }))),
  "gac": React.lazy(() => import("@/components/dashboard/gac/GACPage").then(m => ({ default: m.default }))),
}
