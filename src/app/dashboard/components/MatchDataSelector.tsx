"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import type { Event, EventDataE, Stage } from "./event"
import { getEventData, getGroupAndSchedule, type GroupAndSchedule, type Schedule } from "@/server/database"

interface MatchDataSelectorProps {
  handleMatchChange: (matchId: string) => void
  onSelectionChange?: (selection: {
    event: string
    stage: string
    group: string
    matchNo: string | undefined
  }) => void
  event: string
  setEvent: (event: string) => void
}

export default function MatchDataSelector({
  handleMatchChange,
  onSelectionChange,
  event,
  setEvent,
}: MatchDataSelectorProps) {
  const [stage, setStage] = useState<string>("")
  const [group, setGroup] = useState<string>("")
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined)

  const [eventData, setEventData] = useState<EventDataE[]>([])
  const [eventList, setEventList] = useState<Event[]>([])
  const [stageList, setStageList] = useState<Stage[]>([])
  const [groupList, setGroupList] = useState<GroupAndSchedule[]>([])
  const [scheduleList, setScheduleList] = useState<Schedule[]>([])

  useEffect(() => {
    async function fetchEventList() {
      const eventData = await getEventData()
      if (!eventData.length) {
        return
      }
      setEventData(eventData)

      const events = eventData.map((event: any) => ({
        id: event.id,
        name: event.name,
      }))
      setEventList(events)
    }
    fetchEventList()
  }, [])

  useEffect(() => {
    const stages = eventData.find((e) => e.id === event)?.stages || []
    setStageList(stages)
  }, [event, eventData])

  useEffect(() => {
    async function fetchGroupData() {
      if (stage === "") {
        return
      }
      const groupAndScheduleData = await getGroupAndSchedule(stage)
      const { groups } = groupAndScheduleData
      setGroupList(groups)
    }
    fetchGroupData()
  }, [stage])

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId)
    const scheduleData = groupList.find((group) => group.id === groupId)?.schedule || []
    setScheduleList(scheduleData)
  }

  const handleMatchNoChange = (value: string) => {
    setMatchNo(value)
    handleMatchChange(value)
  }

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({ event, stage, group, matchNo })
    }
  }, [event, stage, group, matchNo, onSelectionChange])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="space-y-2">
        <Label htmlFor="event">Event</Label>
        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger id="event">
            <SelectValue placeholder="Select Event" />
          </SelectTrigger>
          <SelectContent>
            {eventList.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stage">Stage</Label>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger id="stage">
            <SelectValue placeholder="Select Stage" />
          </SelectTrigger>
          <SelectContent>
            {stageList.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="group">Group</Label>
        <Select value={group} onValueChange={handleGroupChange}>
          <SelectTrigger id="group">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            {groupList.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="matchNo">Match Number</Label>
        <Select value={matchNo} onValueChange={handleMatchNoChange}>
          <SelectTrigger id="matchNo">
            <SelectValue placeholder="Select Match Number" />
          </SelectTrigger>
          <SelectContent>
            {scheduleList.map((schedule) => (
              <SelectItem key={schedule.id} value={schedule.id}>
                {`Match ${schedule.matchNo}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
