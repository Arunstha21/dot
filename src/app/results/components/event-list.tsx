"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import EventDialog from "./event-dialogue"
import { EventData, GroupAndSchedule } from "@/server/publicResult"
import ResultsPage from "./resultsPage"

export default function EventList({ eventsData }: { eventsData: EventData[] }) {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [selectedData, setSelectedData] = useState<{
    stage: EventData['stages'][number] | null
    group: EventData['stages'][number]['groups'][number] | null
    groupAndSchedule: GroupAndSchedule | null
  } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleEventClick = (event: EventData) => {
    setSelectedEvent(event)
    setSelectedData(null)
    setDialogOpen(true)
  }
  return (
    <div className="flex flex-1 h-screen">
      <aside className="w-64 border-r p-4">
        <div className="space-y-2">
          {eventsData.map((event) => (
            <Button
              key={event.id}
              variant="outline"
              className="w-full justify-start text-sm truncate overflow-hidden text-ellipsis"
              onClick={() => handleEventClick(event)}
            >
              {event.name}
            </Button>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-4">
        <div className="flex h-full">
          {selectedData && !dialogOpen ? (
            <ResultsPage
              eventName={selectedEvent?.name || ""}
              stageName={selectedData.stage?.name || ""}
              groupName={selectedData.group?.name || ""}
              data={selectedData.groupAndSchedule as GroupAndSchedule}
            />
          ) : (
            <p className="text-muted-foreground">Select an event to view details</p>
          )}
        </div>
      </main>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        setSelectedData={setSelectedData as React.Dispatch<React.SetStateAction<{
          stage: EventData['stages'][number] | null
          group: EventData['stages'][number]['groups'][number] | null
          groupAndSchedule: GroupAndSchedule | null
        } | null>>}
      />
    </div>
  )
}
