"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import EventDialog from "./event-dialogue"
import { EventData, GroupAndSchedule } from "@/server/publicResult"
import ResultsPage from "./resultsPage"
import { NoResultsSelected } from "./empty-states"

export default function EventList({ eventsData }: { eventsData: EventData[] }) {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [selectedData, setSelectedData] = useState<{
    stage: EventData['stages'][number] | null
    group: EventData['stages'][number]['groups'][number] | null
    groupAndSchedule: GroupAndSchedule | null
  } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleEventClick = (event: EventData) => {
    setSelectedEvent(event)
    setSelectedData(null)
    setDialogOpen(true)
    setSheetOpen(false)
  }

  const sidebarContent = (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-3 px-1">Events</h3>
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
  )

  return (
    <div className="flex flex-1 h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 border-r p-4">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar with Sheet */}
      <div className="md:hidden absolute top-16 left-4 z-10">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 p-4 mt-12 md:mt-0">
        <div className="flex h-full">
          {selectedData && !dialogOpen ? (
            <ResultsPage
              eventName={selectedEvent?.name || ""}
              stageName={selectedData.stage?.name || ""}
              groupName={selectedData.group?.name || ""}
              data={selectedData.groupAndSchedule as GroupAndSchedule}
            />
          ) : (
            <NoResultsSelected />
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
