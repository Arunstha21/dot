import { useState, useEffect, useCallback } from "react"
import { getEventData, getGroupAndSchedule, type GroupAndSchedule, type Schedule, type EventData } from "@/server/database"
import { toast } from "sonner"

type Event = { id: string; name: string }
type Stage = { id: string; name: string }

interface UseEventDataProps {
  fetchOnMount?: boolean
}

interface UseEventDataReturn {
  // Event/Stages
  event: string
  setEvent: (event: string) => void
  stage: string
  setStage: (stage: string) => void

  // Lists
  eventData: EventData[]
  eventList: Event[]
  stageList: Stage[]

  // Loading states
  isLoadingEvents: boolean
  isLoadingStages: boolean

  // Actions
  refreshEventData: () => Promise<void>
}

export function useEventData({ fetchOnMount = true }: UseEventDataProps = {}): UseEventDataReturn {
  const [event, setEvent] = useState<string>("")
  const [stage, setStage] = useState<string>("")

  const [eventData, setEventData] = useState<EventData[]>([])
  const [eventList, setEventList] = useState<Event[]>([])
  const [stageList, setStageList] = useState<Stage[]>([])

  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isLoadingStages, setIsLoadingStages] = useState(false)

  const refreshEventData = useCallback(async () => {
    setIsLoadingEvents(true)
    try {
      const data = await getEventData()
      if (!data?.length) {
        return
      }
      setEventData(data)
      setEventList(data.map((e: any) => ({ id: e.id, name: e.name })))
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setIsLoadingEvents(false)
    }
  }, [])

  // Update stage list when event changes
  useEffect(() => {
    if (!event) {
      setStageList([])
      return
    }

    setIsLoadingStages(true)
    const stages = eventData.find((e) => e.id === event)?.stages || []
    setStageList(stages)
    setIsLoadingStages(false)
  }, [event, eventData])

  // Initial fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      refreshEventData()
    }
  }, [fetchOnMount, refreshEventData])

  return {
    event,
    setEvent,
    stage,
    setStage,
    eventData,
    eventList,
    stageList,
    isLoadingEvents,
    isLoadingStages,
    refreshEventData,
  }
}

export function useGroupAndSchedule() {
  const [groupList, setGroupList] = useState<GroupAndSchedule[]>([])
  const [scheduleList, setScheduleList] = useState<Schedule[]>([])
  const [isMultiGroup, setIsMultiGroup] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchGroups = useCallback(async (stageId: string) => {
    if (!stageId) {
      setGroupList([])
      return
    }

    setIsLoading(true)
    try {
      const groupAndScheduleData = await getGroupAndSchedule(stageId)
      let groups = groupAndScheduleData.groups

      // Add "All" option for multi-group stages
      if (groupAndScheduleData.isMultiGroup) {
        groups = [
          ...groups,
          {
            id: "all",
            name: "All",
            data: groups.flatMap((g) => g.data),
            schedule: groups.flatMap((g) => g.schedule).sort((a, b) => a.matchNo - b.matchNo),
          }
        ]
        setIsMultiGroup(true)
      } else {
        setIsMultiGroup(false)
      }

      setGroupList(groups)
    } catch (error) {
      console.error("Error fetching group data:", error)
      toast.error("Failed to load group data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleGroupChange = useCallback((groupId: string) => {
    const group = groupList.find((g) => g.id === groupId)
    if (group) {
      setScheduleList(group.schedule)
    }
  }, [groupList])

  return {
    groupList,
    setGroupList,
    scheduleList,
    setScheduleList,
    isMultiGroup,
    setIsMultiGroup,
    isLoading,
    fetchGroups,
    handleGroupChange,
  }
}
