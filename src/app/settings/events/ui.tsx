"use client"

import { useActionState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  createEventAction,
  addStageAction,
  addGroupAction,
  deleteEventAction,
  deleteStageAction,
  deleteGroupAction,
  type ActionResult,
} from "@/server/actions/events-actions"

type Hierarchy = {
  events: {
    id: string
    name: string
    organizer?: string
    discordLink?: string
    stages: { id: string; name: string; groups: { id: string; name: string }[] }[]
  }[]
}

export default function EventsManager({ initial }: { initial: Hierarchy }) {
  const [createEventState, createEvent, creating] = useActionState<ActionResult, FormData>(createEventAction, {
    status: "success",
  })
  const [addStageState, addStage] = useActionState<ActionResult, FormData>(addStageAction, { status: "success" })
  const [addGroupState, addGroup] = useActionState<ActionResult, FormData>(addGroupAction, { status: "success" })
  const [delEventState, delEvent] = useActionState<ActionResult, FormData>(deleteEventAction, { status: "success" })
  const [delStageState, delStage] = useActionState<ActionResult, FormData>(deleteStageAction, { status: "success" })
  const [delGroupState, delGroup] = useActionState<ActionResult, FormData>(deleteGroupAction, { status: "success" })

  useEffect(() => {
    for (const s of [createEventState, addStageState, addGroupState, delEventState, delStageState, delGroupState]) {
      if (s?.status === "error") toast.error(s.message)
      if (s?.status === "success" && s.message) toast.success(s.message)
    }
  }, [createEventState, addStageState, addGroupState, delEventState, delStageState, delGroupState])

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Events Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={createEvent} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label>Event Name</Label>
              <Input name="name" />
            </div>
            <div>
              <Label>Organizer</Label>
              <Input name="organizer" />
            </div>
            <div>
              <Label>Discord Link</Label>
              <Input name="discordLink" />
            </div>
            <div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {initial.events.length === 0 && <p className="text-muted-foreground">No events. Use the form above.</p>}
            {initial.events.map((e) => (
              <div key={e.id} className="border rounded-md p-3 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.organizer || "Organizer N/A"} • {e.discordLink || "Discord N/A"}
                    </div>
                  </div>
                  <form
                    action={delEvent}
                    onSubmit={(ev) => {
                      if (!confirm("Delete event and all child data?")) ev.preventDefault()
                    }}
                  >
                    <input type="hidden" name="eventId" value={e.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Delete Event
                    </Button>
                  </form>
                </div>

                <form action={addStage} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                  <input type="hidden" name="eventId" value={e.id} />
                  <div className="sm:col-span-3">
                    <Label>New Stage Name</Label>
                    <Input name="name" placeholder="e.g. Qualifiers" />
                  </div>
                  <div>
                    <Button type="submit" variant="outline">
                      Add Stage
                    </Button>
                  </div>
                </form>

                <div className="space-y-2">
                  {e.stages.map((s) => (
                    <div key={s.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Stage: {s.name}</div>
                        <form action={delStage}>
                          <input type="hidden" name="stageId" value={s.id} />
                          <Button type="submit" variant="destructive" size="sm">
                            Delete Stage
                          </Button>
                        </form>
                      </div>

                      <form action={addGroup} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mt-2">
                        <input type="hidden" name="stageId" value={s.id} />
                        <div className="sm:col-span-3">
                          <Label>New Group Name</Label>
                          <Input name="name" placeholder="e.g. Group A" />
                        </div>
                        <div>
                          <Button type="submit" variant="outline" size="sm">
                            Add Group
                          </Button>
                        </div>
                      </form>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {s.groups.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center justify-between border rounded p-2 bg-background"
                          >
                            <div>{g.name}</div>
                            <form action={delGroup}>
                              <input type="hidden" name="groupId" value={g.id} />
                              <Button type="submit" variant="destructive" size="sm">
                                Delete Group
                              </Button>
                            </form>
                          </div>
                        ))}
                        {s.groups.length === 0 && (
                          <p className="text-xs text-muted-foreground">No groups yet. Add one above.</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {e.stages.length === 0 && (
                    <p className="text-xs text-muted-foreground">No stages for this event. Add a stage above.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
