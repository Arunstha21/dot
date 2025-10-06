"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Schedule } from "@/server/database"

export default function ScheduleData({
  matches,
  setMatches,
  isEditing,
}: {
  matches: Schedule[]
  setMatches: (m: Schedule[]) => void
  isEditing?: boolean
}) {
  const [local, setLocal] = useState(matches)

  const update = (idx: number, patch: Partial<Schedule>) => {
    const next = [...local]
    next[idx] = { ...next[idx], ...patch }
    setLocal(next)
    setMatches(next)
  }

  return (
    <div className="space-y-2">
      <div className="font-medium">Matches</div>
      <div className="space-y-2">
        {local.map((m, i) => (
          <div key={m.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
            <div>Match {m.matchNo}</div>
            <Input
              disabled={!isEditing}
              value={m.map}
              onChange={(e) => update(i, { map: e.target.value })}
              placeholder="Map"
            />
            <Input
              disabled={!isEditing}
              value={m.date}
              onChange={(e) => update(i, { date: e.target.value })}
              placeholder="dd-mm-yyyy"
            />
            <Input
              disabled={!isEditing}
              value={m.startTime}
              onChange={(e) => update(i, { startTime: e.target.value })}
              placeholder="HH:mm"
            />
            <Button type="button" variant="outline" disabled>
              Saved
            </Button>
          </div>
        ))}
        {local.length === 0 && <p className="text-sm text-muted-foreground">No matches found for this group.</p>}
      </div>
    </div>
  )
}
