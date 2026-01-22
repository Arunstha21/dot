"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Schedule } from "@/server/database"

type Props = {
  matchNo?: string
  setMatchNo: (v: string) => void
  matchId?: number
  setMatchId: (v?: number) => void
  password: string
  setPassword: (v: string) => void
  scheduleList: Schedule[]
}

export default function IdPassFields({
  matchNo, setMatchNo,
  matchId, setMatchId,
  password, setPassword,
  scheduleList
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label htmlFor="matchNo">Match Number</Label>
        <Select value={matchNo} onValueChange={setMatchNo}>
          <SelectTrigger id="matchNo">
            <SelectValue placeholder="Select Match" />
          </SelectTrigger>
          <SelectContent>
            {scheduleList.map((s) => (
              <SelectItem key={s.id} value={s.id}>{`Match ${s.matchNo}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="matchId">Match ID</Label>
        <Input
          id="matchId"
          type="number"
          value={matchId || ""}
          onChange={(e) => setMatchId(e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
    </div>
  )
}
