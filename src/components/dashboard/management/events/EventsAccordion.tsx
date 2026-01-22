"use client"

import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  deleteEventAction,
  deleteStageAction,
  deleteGroupAction,
  updateEventAction,
  updateStageAction,
  updateGroupAction,
  bulkUpdateSchedulesAction,
  type ActionResult,
} from "@/server/actions/events-actions"
import { DiscordSetup } from "@/components/discord/ResultSetup"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ScheduleData from "@/components/EventsScheduleData"
import type { EventsData } from "./EventsManagement"

type Schedule = {
  id: string
  matchNo: number
  map: string
  date: string
  startTime: string
  overallMatchNo?: number
}

type PointSystem = {
  id: string
  name: string
  pointSystem: Record<string, number>
}

type AvailablePointSystems = {
  id: string
  name: string
}[]

interface EventsAccordionProps {
  initialData: EventsData[]
  availablePointSystems: AvailablePointSystems
  onDataChange?: () => void
}

export function EventsAccordion({ initialData, availablePointSystems, onDataChange }: EventsAccordionProps) {
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false)
  const [editStageDialogOpen, setEditStageDialogOpen] = useState(false)
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventsData | null>(null)
  const [selectedStage, setSelectedStage] = useState<{ id: string; name: string; eventId: string } | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<{
    id: string
    name: string
    schedules: Schedule[]
    stageId: string
    eventId: string
  } | null>(null)

  // Form states
  const [eventName, setEventName] = useState("")
  const [eventOrganizer, setEventOrganizer] = useState("")
  const [eventDiscordLink, setEventDiscordLink] = useState("")
  const [eventIsPublic, setEventIsPublic] = useState(false)
  const [eventPointSystemId, setEventPointSystemId] = useState<string>("default")

  const [stageName, setStageName] = useState("")
  const [groupName, setGroupName] = useState("")
  const [groupSchedules, setGroupSchedules] = useState<Schedule[]>([])

  const [delEventState, delEvent] = useActionState<ActionResult, FormData>(deleteEventAction, { status: "success" })
  const [delStageState, delStage] = useActionState<ActionResult, FormData>(deleteStageAction, { status: "success" })
  const [delGroupState, delGroup] = useActionState<ActionResult, FormData>(deleteGroupAction, { status: "success" })
  const [updateEventState, updateEvent] = useActionState<ActionResult, FormData>(updateEventAction, {
    status: "success",
  })
  const [updateStageState, updateStage] = useActionState<ActionResult, FormData>(updateStageAction, {
    status: "success",
  })
  const [updateGroupState, updateGroup] = useActionState<ActionResult, FormData>(updateGroupAction, {
    status: "success",
  })
  const [bulkUpdateSchedulesState, bulkUpdateSchedules] = useActionState<ActionResult, FormData>(
    bulkUpdateSchedulesAction,
    {
      status: "success",
    },
  )

  useEffect(() => {
    for (const s of [
      delEventState,
      delStageState,
      delGroupState,
      updateEventState,
      updateStageState,
      updateGroupState,
      bulkUpdateSchedulesState,
    ]) {
      if (s?.status === "error") toast.error(s.message)
      if (s?.status === "success" && s.message) {
        toast.success(s.message)
        // Close dialogs on success
        setEditEventDialogOpen(false)
        setEditStageDialogOpen(false)
        setEditGroupDialogOpen(false)
        onDataChange?.()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    delEventState,
    delStageState,
    delGroupState,
    updateEventState,
    updateStageState,
    updateGroupState,
    bulkUpdateSchedulesState,
  ])

  const handleEditEvent = (event: EventsData) => {
    setSelectedEvent(event)
    setEventName(event.name)
    setEventOrganizer(event.organizer || "")
    setEventDiscordLink(event.discordLink || "")
    setEventIsPublic(event.isPublic)
    setEventPointSystemId(event.pointSystem?.id || "default")
    setEditEventDialogOpen(true)
  }

  const handleEditStage = (stage: { id: string; name: string }, eventId: string) => {
    setSelectedStage({ ...stage, eventId })
    setStageName(stage.name)
    setEditStageDialogOpen(true)
  }

  const handleEditGroup = (
    group: { id: string; name: string; schedules: Schedule[] },
    stageId: string,
    eventId: string,
  ) => {
    setSelectedGroup({ ...group, stageId, eventId })
    setGroupName(group.name)
    setGroupSchedules(
      group.schedules && group.schedules.length > 0
        ? group.schedules
        : [{ id: "", matchNo: 1, map: "", date: "", startTime: "" }],
    )
    setEditGroupDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Events Management</CardTitle>
          <CardDescription>
            View and manage existing events, stages, groups, schedules, and point systems. Edit any component to update
            its details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No events found. Create events from the Events Manager.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {initialData.map((event) => (
                <AccordionItem key={event.id} value={event.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <div className="font-semibold flex items-center gap-2">
                          {event.name}
                          {event.isPublic && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Public</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.organizer || "No organizer"} • {event.stages.length} stages
                          {event.pointSystem && ` • ${event.pointSystem.name}`}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* Event Details */}
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Event Details</h4>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>

                            <form
                              action={delEvent}
                              onSubmit={(e) => {
                                if (!confirm("Delete this event and all associated data?")) e.preventDefault()
                              }}
                            >
                              <input type="hidden" name="eventId" value={event.id} />
                              <Button size="sm" variant="destructive" type="submit">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </form>
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Organizer:</span> {event.organizer || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Discord:</span> {event.discordLink || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Visibility:</span> {event.isPublic ? "Public" : "Private"}
                          </div>
                          <div>
                            <span className="font-medium">Point System:</span> {event.pointSystem?.name || "None"}
                          </div>
                        </div>
                      </div>

                      {/* Stages */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Stages ({event.stages.length})</h4>
                        {event.stages.map((stage) => (
                          <div key={stage.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{stage.name}</div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditStage(stage, event.id)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>

                                <form action={delStage}>
                                  <input type="hidden" name="stageId" value={stage.id} />
                                  <Button size="sm" variant="destructive" type="submit">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </form>
                              </div>
                            </div>

                            {/* Groups */}
                            {stage.groups.length > 0 && (
                              <div className="pl-4 space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                  Groups ({stage.groups.length})
                                </div>
                                <div className="space-y-2">
                                  {stage.groups.map((group) => (
                                    <div key={group.id} className="bg-background rounded p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <span className="font-medium">{group.name}</span>
                                          <span className="text-xs text-muted-foreground ml-2">
                                            ({group.schedules?.length || 0} matches)
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEditGroup(group, stage.id, event.id)}
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <form action={delGroup}>
                                            <input type="hidden" name="groupId" value={group.id} />
                                            <Button size="sm" variant="ghost" type="submit">
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </form>
                                        </div>
                                      </div>

                                      {/* Schedule Preview */}
                                      {group.schedules && group.schedules.length > 0 && (
                                        <div className="text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                                          <div className="font-medium mb-1">Schedule:</div>
                                          {group.schedules.slice(0, 3).map((schedule) => (
                                            <div key={schedule.id}>
                                              Match {schedule.matchNo}: {schedule.map} - {schedule.date} at{" "}
                                              {schedule.startTime}
                                            </div>
                                          ))}
                                          {group.schedules.length > 3 && (
                                            <div className="italic">+{group.schedules.length - 3} more matches</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {event.stages.length === 0 && (
                          <p className="text-sm text-muted-foreground">No stages for this event</p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      <Dialog open={editEventDialogOpen} onOpenChange={setEditEventDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event information and settings</DialogDescription>
          </DialogHeader>
          <form action={updateEvent} className="space-y-4 py-4">
            <input type="hidden" name="eventId" value={selectedEvent?.id} />
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                name="name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-organizer">Organizer</Label>
              <Input
                id="event-organizer"
                name="organizer"
                value={eventOrganizer}
                onChange={(e) => setEventOrganizer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-discord">Discord Link</Label>
              <Input
                id="event-discord"
                name="discordLink"
                value={eventDiscordLink}
                onChange={(e) => setEventDiscordLink(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="event-public" className="flex flex-col space-y-1">
                <span>Public Event</span>
                <span className="font-normal text-xs text-muted-foreground">Make this event visible to everyone</span>
              </Label>
              <Switch id="event-public" name="isPublic" checked={eventIsPublic} onCheckedChange={setEventIsPublic} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-point-system">Point System</Label>
              <Select name="pointSystemId" value={eventPointSystemId} onValueChange={setEventPointSystemId}>
                <SelectTrigger id="event-point-system">
                  <SelectValue placeholder="Select point system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">None</SelectItem>
                  {availablePointSystems.map((ps) => (
                    <SelectItem key={ps.id} value={ps.id}>
                      {ps.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={editStageDialogOpen} onOpenChange={setEditStageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Stage: {selectedStage?.name}</DialogTitle>
            <DialogDescription>Update stage information and configure Discord results</DialogDescription>
          </DialogHeader>
          <form action={updateStage} className="space-y-6 py-4">
            <input type="hidden" name="stageId" value={selectedStage?.id} />
            <div className="space-y-2">
              <Label htmlFor="stage-name">Stage Name</Label>
              <Input
                id="stage-name"
                name="name"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                required
              />
            </div>

            {/* Discord Setup Section */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Discord Results Setup</Label>
              <p className="text-sm text-muted-foreground">
                Configure Discord integration to automatically send match results to your server
              </p>
              {selectedStage && (
                <DiscordSetup
                  stageId={selectedStage.id}
                  onSetupComplete={(guild) => {
                    toast.success(`Discord setup complete! Results will be sent to ${guild.guildName}`)
                  }}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditStageDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editGroupDialogOpen} onOpenChange={setEditGroupDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Group: {selectedGroup?.name}</DialogTitle>
            <DialogDescription>Update group information and manage schedules</DialogDescription>
          </DialogHeader>
          <form
            action={async (formData: FormData) => {
              // First update the group name
              await updateGroup(formData)
              // Then bulk update schedules
              const schedulesFormData = new FormData()
              schedulesFormData.append("groupId", formData.get("groupId") as string)
              schedulesFormData.append("schedules", formData.get("schedules") as string)
              await bulkUpdateSchedules(schedulesFormData)
            }}
            className="space-y-6 py-4"
          >
            <input type="hidden" name="groupId" value={selectedGroup?.id} />
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                name="name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>

            {/* Schedule Management Section */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Schedule Management</Label>
              <p className="text-sm text-muted-foreground">Add and manage match schedules for this group</p>
              {groupSchedules.length === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGroupSchedules([{ id: "", matchNo: 1, map: "", date: "", startTime: "" }])}
                  className="w-full"
                >
                  Add First Match
                </Button>
              ) : (
                <ScheduleData matches={groupSchedules} setMatches={setGroupSchedules} isEditing={true} />
              )}
              <input type="hidden" name="schedules" value={JSON.stringify(groupSchedules)} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditGroupDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
