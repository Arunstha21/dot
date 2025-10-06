"use client"

import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  deleteEventAction,
  deleteStageAction,
  deleteGroupAction,
  type ActionResult,
} from "@/server/actions/events-actions"
import { DiscordSetup } from "@/components/DiscordResultSetup"

type EventsData = {
  events: {
    id: string
    name: string
    organizer?: string
    discordLink?: string
    stages: {
      id: string
      name: string
      groups: { id: string; name: string }[]
    }[]
  }[]
}

export default function EventsManagement({ initialData }: { initialData: EventsData }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editStageDialogOpen, setEditStageDialogOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<{ id: string; name: string } | null>(null)

  const [delEventState, delEvent] = useActionState<ActionResult, FormData>(deleteEventAction, { status: "success" })
  const [delStageState, delStage] = useActionState<ActionResult, FormData>(deleteStageAction, { status: "success" })
  const [delGroupState, delGroup] = useActionState<ActionResult, FormData>(deleteGroupAction, { status: "success" })

  useEffect(() => {
    for (const s of [delEventState, delStageState, delGroupState]) {
      if (s?.status === "error") toast.error(s.message)
      if (s?.status === "success" && s.message) toast.success(s.message)
    }
  }, [delEventState, delStageState, delGroupState])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events Management</CardTitle>
        <CardDescription>
          View and manage existing events, stages, and groups. To create new records, use the dedicated creation
          interface.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {initialData.events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No events found. Create events from the Events Manager.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {initialData.events.map((event) => (
              <AccordionItem key={event.id} value={event.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <div className="font-semibold">{event.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.organizer || "No organizer"} • {event.stages.length} stages
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
                          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Event</DialogTitle>
                                <DialogDescription>Update event information</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Event Name</Label>
                                  <Input defaultValue={event.name} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Organizer</Label>
                                  <Input defaultValue={event.organizer} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Discord Link</Label>
                                  <Input defaultValue={event.discordLink} />
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    toast.info("Update functionality coming soon")
                                    setEditDialogOpen(false)
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

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
                              <Dialog open={editStageDialogOpen} onOpenChange={setEditStageDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedStage({ id: stage.id, name: stage.name })}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit Stage: {selectedStage?.name}</DialogTitle>
                                    <DialogDescription>
                                      Update stage information and configure Discord results
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6 py-4">
                                    {/* Stage Name */}
                                    <div className="space-y-2">
                                      <Label htmlFor="stage-name">Stage Name</Label>
                                      <Input id="stage-name" defaultValue={selectedStage?.name} />
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
                                            toast.success(
                                              `Discord setup complete! Results will be sent to ${guild.guildName}`,
                                            )
                                          }}
                                        />
                                      )}
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        className="flex-1"
                                        onClick={() => {
                                          toast.info("Stage update functionality coming soon")
                                          setEditStageDialogOpen(false)
                                        }}
                                      >
                                        Save Changes
                                      </Button>
                                      <Button variant="outline" onClick={() => setEditStageDialogOpen(false)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

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
                              <div className="grid gap-2 sm:grid-cols-2">
                                {stage.groups.map((group) => (
                                  <div
                                    key={group.id}
                                    className="flex items-center justify-between bg-background rounded p-2 text-sm"
                                  >
                                    <span>{group.name}</span>
                                    <form action={delGroup}>
                                      <input type="hidden" name="groupId" value={group.id} />
                                      <Button size="sm" variant="ghost" type="submit">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </form>
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
  )
}
