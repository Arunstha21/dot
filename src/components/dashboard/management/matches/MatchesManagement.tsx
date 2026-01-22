"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { getMatchesByGroup, getMatchById, updateMatchAction, PlayerStats, TeamStats } from "@/server/actions/matches-actions"

interface MatchSchedule {
  _id: string
  matchNo: number
  date: string
  map: string
  startTime: string
  stage: string
  event: string
  match: {
    _id: string
    gameId: string
  }
}

interface MatchesManagementProps {
  selectedGroup: string
  groupName: string
}

export default function MatchesManagement({ selectedGroup, groupName }: MatchesManagementProps) {
  const [scheduleData, setScheduleData] = useState<MatchSchedule[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string>("")
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedGroup) loadMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const result = await getMatchesByGroup(selectedGroup)
      setScheduleData(result)
    } catch {
      toast.error("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }

  const loadMatchData = async (matchId: string) => {
    setLoading(true)
    try {
      const result = await getMatchById(matchId)
      if (result.status === "success") {
        setPlayerStats(result?.data?.playerStats || [])
        setTeamStats(result?.data?.teamStats || [])
      } else {
        toast.error(result.message || "Failed to load match data")
      }
    } catch {
      toast.error("Failed to load match data")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMatch = async () => {
    if (!selectedMatch) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.set("matchId", selectedMatch)
      formData.set("playerStats", JSON.stringify(playerStats))
      formData.set("teamStats", JSON.stringify(teamStats))

      const result = await updateMatchAction({} as any, formData)
      if (result.status === "success") toast.success("Match stats updated successfully")
      else toast.error(result.message || "Failed to update match")
    } catch {
      toast.error("Failed to update match")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle>Matches in {groupName}</CardTitle>
          <CardDescription>Select a match to view and edit stats</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduleData.length > 0 ? (
            <div className="space-y-2">
              <Label>Match</Label>
              <Select
                value={selectedMatch}
                onValueChange={(val) => {
                  setSelectedMatch(val)
                  loadMatchData(val)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a match" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleData.map((schedule) => (
                    schedule.match && <SelectItem key={schedule.match._id} value={schedule.match._id}>
                      Match {schedule.matchNo} - {schedule.map}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            !loading && (
              <p className="text-center text-muted-foreground py-8">
                No matches found in this group
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Player Stats */}
      {selectedMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Player Stats</CardTitle>
            <CardDescription>View and edit player statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : playerStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 border">Player</th>
                      <th className="p-2 border">Kills</th>
                      <th className="p-2 border">Damage</th>
                      <th className="p-2 border">Assists</th>
                      <th className="p-2 border">Rank</th>
                      <th className="p-2 border">Survival Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.map((p, idx) => (
                      <tr key={p._id}>
                        <td className="border p-2">{p.player?.name || "Unknown"}</td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={p.killNum}
                            onChange={(e) => {
                              const updated = [...playerStats]
                              updated[idx].killNum = Number(e.target.value)
                              setPlayerStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={p.damage}
                            onChange={(e) => {
                              const updated = [...playerStats]
                              updated[idx].damage = Number(e.target.value)
                              setPlayerStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={p.assists}
                            onChange={(e) => {
                              const updated = [...playerStats]
                              updated[idx].assists = Number(e.target.value)
                              setPlayerStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={p.rank}
                            onChange={(e) => {
                              const updated = [...playerStats]
                              updated[idx].rank = Number(e.target.value)
                              setPlayerStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={p.survivalTime}
                            onChange={(e) => {
                              const updated = [...playerStats]
                              updated[idx].survivalTime = Number(e.target.value)
                              setPlayerStats(updated)
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No player stats found for this match
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Stats */}
      {selectedMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Team Stats</CardTitle>
            <CardDescription>View and edit team statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : teamStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 border">Team</th>
                      <th className="p-2 border">Kills</th>
                      <th className="p-2 border">Damage</th>
                      <th className="p-2 border">Assists</th>
                      <th className="p-2 border">Rank</th>
                      <th className="p-2 border">Survival Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStats.map((t, idx) => (
                      <tr key={t._id}>
                        <td className="border p-2">{t.team?.name || "Unknown"}</td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={t.killNum}
                            onChange={(e) => {
                              const updated = [...teamStats]
                              updated[idx].killNum = Number(e.target.value)
                              setTeamStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={t.damage}
                            onChange={(e) => {
                              const updated = [...teamStats]
                              updated[idx].damage = Number(e.target.value)
                              setTeamStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={t.assists}
                            onChange={(e) => {
                              const updated = [...teamStats]
                              updated[idx].assists = Number(e.target.value)
                              setTeamStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={t.rank}
                            onChange={(e) => {
                              const updated = [...teamStats]
                              updated[idx].rank = Number(e.target.value)
                              setTeamStats(updated)
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <Input
                            type="number"
                            value={t.survivalTime}
                            onChange={(e) => {
                              const updated = [...teamStats]
                              updated[idx].survivalTime = Number(e.target.value)
                              setTeamStats(updated)
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No team stats found for this match
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {selectedMatch && (playerStats.length > 0 || teamStats.length > 0) && (
        <Button onClick={handleUpdateMatch} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
      )}
    </div>
  )
}
