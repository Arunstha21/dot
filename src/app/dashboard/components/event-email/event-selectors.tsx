"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Event, Stage } from "../event"
import type { GroupAndSchedule } from "@/server/database"

type Props = {
  event: string
  setEvent: (v: string) => void
  stage: string
  setStage: (v: string) => void
  group: string
  onGroupChange: (v: string) => void
  events: Event[]
  stages: Stage[]
  groups: GroupAndSchedule[]
}

export default function EventSelectors({
  event, setEvent,
  stage, setStage,
  group, onGroupChange,
  events, stages, groups
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label htmlFor="event">Event</Label>
        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger id="event">
            <SelectValue placeholder="Select Event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="stage">Stage</Label>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger id="stage">
            <SelectValue placeholder="Select Stage" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="group">Group</Label>
        <Select value={group} onValueChange={onGroupChange}>
          <SelectTrigger id="group">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
