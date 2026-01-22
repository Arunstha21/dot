"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { getEventData } from "@/server/database"
import { toast } from "sonner"

export type Stage = {
  id: string
  name: string
}

export type Event = {
  id: string
  name: string
}

interface EventData {
  id: string
  name: string
  discordLink?: string
  organizer?: string
  stages: Stage[]
}

interface EventDataContextType {
  eventData: EventData[]
  eventList: Event[]
  isLoading: boolean
  refreshEventData: () => Promise<void>
  getEventById: (id: string) => EventData | undefined
}

const EventDataContext = createContext<EventDataContextType | undefined>(undefined)

interface EventDataProviderProps {
  children: ReactNode
}

export function EventDataProvider({ children }: EventDataProviderProps) {
  const [eventData, setEventData] = useState<EventData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch event data on mount
  useEffect(() => {
    async function fetchEventData() {
      setIsLoading(true)
      try {
        const events = await getEventData()
        setEventData(events)
      } catch (error) {
        console.error("Failed to fetch event data:", error)
        toast.error("Unable to load event data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventData()
  }, [])

  // Derive event list from event data
  const eventList: Event[] = eventData.map((e) => ({ id: e.id, name: e.name }))

  // Refresh function
  const refreshEventData = useCallback(async () => {
    setIsLoading(true)
    try {
      const events = await getEventData()
      setEventData(events)
      toast.success("Event data refreshed")
    } catch (error) {
      console.error("Failed to refresh event data:", error)
      toast.error("Unable to refresh event data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Helper to get event by ID
  const getEventById = useCallback(
    (id: string) => {
      return eventData.find((e) => e.id === id)
    },
    [eventData]
  )

  const value: EventDataContextType = {
    eventData,
    eventList,
    isLoading,
    refreshEventData,
    getEventById,
  }

  return (
    <EventDataContext.Provider value={value}>
      {children}
    </EventDataContext.Provider>
  )
}

export function useEventData() {
  const context = useContext(EventDataContext)
  if (context === undefined) {
    throw new Error("useEventData must be used within EventDataProvider")
  }
  return context
}
