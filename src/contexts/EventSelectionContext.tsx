"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface EventSelection {
  eventId: string
  stageId: string
  groupId: string
  eventName: string
  stageName: string
  groupName: string
}

interface EventSelectionContextType {
  selection: EventSelection
  setSelection: (selection: EventSelection) => void
  clearSelection: () => void
}

const EventSelectionContext = createContext<EventSelectionContextType | undefined>(undefined)

const STORAGE_KEY = "dashboard-event-selection"

interface EventSelectionProviderProps {
  children: ReactNode
}

export function EventSelectionProvider({ children }: EventSelectionProviderProps) {
  // Load from localStorage on mount
  const [selection, setSelectionState] = useState<EventSelection>(() => {
    if (typeof window === "undefined") {
      return {
        eventId: "",
        stageId: "",
        groupId: "",
        eventName: "",
        stageName: "",
        groupName: "",
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error("Failed to load event selection from localStorage:", error)
    }

    return {
      eventId: "",
      stageId: "",
      groupId: "",
      eventName: "",
      stageName: "",
      groupName: "",
    }
  })

  // Persist to localStorage whenever selection changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
    } catch (error) {
      console.error("Failed to save event selection to localStorage:", error)
    }
  }, [selection])

  const setSelection = (newSelection: EventSelection) => {
    setSelectionState(newSelection)
  }

  const clearSelection = () => {
    setSelectionState({
      eventId: "",
      stageId: "",
      groupId: "",
      eventName: "",
      stageName: "",
      groupName: "",
    })
  }

  return (
    <EventSelectionContext.Provider value={{ selection, setSelection, clearSelection }}>
      {children}
    </EventSelectionContext.Provider>
  )
}

export function useEventSelection() {
  const context = useContext(EventSelectionContext)
  if (context === undefined) {
    throw new Error("useEventSelection must be used within EventSelectionProvider")
  }
  return context
}
