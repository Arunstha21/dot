"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listAllHierarchy } from "@/server/actions/events-actions"
import listPointSystems from "@/server/actions/events-actions"
import { Loader2 } from "lucide-react"
import { EventsAccordion } from "./EventsAccordion"

export type EventsData = {
  id: string
  name: string
  organizer?: string
  discordLink?: string
  isPublic: boolean
  pointSystem?: { id: string; name: string }
  stages: {
    id: string
    name: string
    groups: {
      id: string
      name: string
      schedules: Array<{
        id: string
        matchNo: number
        map: string
        date: string
        startTime: string
        overallMatchNo?: number
      }>
    }[]
  }[]
}

export default function EventsManagement() {
  const [events, setEvents] = useState<EventsData[]>([])
  const [availablePointSystems, setAvailablePointSystems] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [eventsResult, pointSystems] = await Promise.all([
        listAllHierarchy(),
        listPointSystems(),
      ])

      if (eventsResult.status === "success" && eventsResult.events) {
        setEvents(eventsResult.events)
      }

      if (Array.isArray(pointSystems)) {
        setAvailablePointSystems(pointSystems)
      }
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return <EventsAccordion initialData={events} availablePointSystems={availablePointSystems} onDataChange={loadData} />
}
