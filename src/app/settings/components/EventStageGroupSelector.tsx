"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { listAllHierarchy } from "@/server/actions/events-actions"

interface Event {
  id: string
  name: string
  organizer?: string
  discordLink?: string
  stages: Stage[]
}

interface Stage {
  id: string
  name: string
  groups: Group[]
}

interface Group {
  id: string
  name: string
}

interface EventStageGroupSelectorProps {
  onSelectionChange: (selection: {
    eventId: string
    stageId: string
    groupId: string
    eventName: string
    stageName: string
    groupName: string
  }) => void
  selectedEvent?: string
  selectedStage?: string
  selectedGroup?: string
  onEventChange?: (eventId: string) => void
  onStageChange?: (stageId: string) => void
  onGroupChange?: (groupId: string) => void
}

export default function EventStageGroupSelector({
  onSelectionChange,
  selectedEvent: controlledEvent = "",
  selectedStage: controlledStage = "",
  selectedGroup: controlledGroup = "",
  onEventChange,
  onStageChange,
  onGroupChange,
}: EventStageGroupSelectorProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const result = await listAllHierarchy()
      if (result.status === "success" && result.events) {
        setEvents(result.events)
      }
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedEventData = events.find((e) => e.id === controlledEvent)
  const selectedStageData = selectedEventData?.stages.find(
    (s) => s.id === controlledStage
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Event Context</CardTitle>
        <CardDescription>
          Choose an event, stage, and group to manage
        </CardDescription>
      </CardHeader>
      <CardContent className="flex space-y-4 justify-start flex-row ">
        {/* Event Selection */}
        <div className="space-y-2 mr-4">
          <Label>Event</Label>
          <Select
            value={controlledEvent}
            onValueChange={(value) => {
              onEventChange?.(value)
              onStageChange?.("")
              onGroupChange?.("")

              const event = events.find((e) => e.id === value)
              onSelectionChange({
                eventId: value,
                stageId: "",
                groupId: "",
                eventName: event?.name || "",
                stageName: "",
                groupName: "",
              })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage Selection */}
        {controlledEvent && (
          <div className="space-y-2 mr-4">
            <Label>Stage</Label>
            <Select
              value={controlledStage}
              onValueChange={(value) => {
                onStageChange?.(value)
                onGroupChange?.("")

                const stage = selectedEventData?.stages.find(
                  (s) => s.id === value
                )
                onSelectionChange({
                  eventId: controlledEvent,
                  stageId: value,
                  groupId: "",
                  eventName: selectedEventData?.name || "",
                  stageName: stage?.name || "",
                  groupName: "",
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {selectedEventData?.stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Group Selection */}
        {controlledStage && (
          <div className="space-y-2">
            <Label>Group</Label>
            <Select
              value={controlledGroup}
              onValueChange={(value) => {
                onGroupChange?.(value)

                const group = selectedStageData?.groups.find(
                  (g) => g.id === value
                )
                onSelectionChange({
                  eventId: controlledEvent,
                  stageId: controlledStage,
                  groupId: value,
                  eventName: selectedEventData?.name || "",
                  stageName: selectedStageData?.name || "",
                  groupName: group?.name || "",
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {selectedStageData?.groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
