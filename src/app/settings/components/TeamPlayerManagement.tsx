"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { deleteTeamAction, getTeamsByGroup, updateTeamAction } from "@/server/actions/teams-actions"
import { deletePlayerAction, updatePlayerAction } from "@/server/actions/player-actions"
import { toast } from "sonner"

interface Player {
  _id: string
  name: string
  uid: string
  email: string
  discord?: {
    userName: string
    email: string
    role: string[]
    guild: string
    serverJoined: boolean
    emailSent: number
    otp?: number
    sender?: string
  }
  gacUsername?: string
  gacPassword?: string
  gacInGameName?: string
}

interface Team {
  _id: string
  slot: number
  name: string
  tag?: string
  email: string
  players: Player[]
}

export default function TeamsPlayersManagement({
  selectedGroup,
  groupName,
}: {
  selectedGroup: string
  groupName: string
}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  useEffect(() => {
    if (selectedGroup) loadTeams()
  }, [selectedGroup])

  const loadTeams = async () => {
    setLoading(true)
    try {
      const result = await getTeamsByGroup(selectedGroup)
      setTeams(result)
    } catch (error) {
      toast.error("Failed to load teams")
      console.error("Error loading teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTeam = async (teamId: string, updates: Partial<Team>) => {
    try {
      const formData = new FormData()
      formData.append("teamId", teamId)
      if (updates.name !== undefined) formData.append("name", updates.name)
      if (updates.tag !== undefined) formData.append("tag", updates.tag)
      if (updates.email !== undefined) formData.append("email", updates.email)
      if (updates.slot !== undefined) formData.append("slot", updates.slot.toString())

      const result = await updateTeamAction({} as any, formData)
      if (result.status === "success") {
        toast.success("Team updated successfully")
        loadTeams()
        setEditingTeam(null)
      } else {
        toast.error(result.message || "Failed to update team")
      }
    } catch (error) {
      toast.error("Failed to update team")
      console.error("Error updating team:", error)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return

    try {
      const formData = new FormData()
      formData.append("teamId", teamId)
      const result = await deleteTeamAction({} as any, formData)
      if (result.status === "success") {
        toast.success("Team deleted successfully")
        loadTeams()
      } else {
        toast.error(result.message || "Failed to delete team")
      }
    } catch (error) {
      toast.error("Failed to delete team")
      console.error("Error deleting team:", error)
    }
  }

  const handleUpdatePlayer = async (playerId: string, updates: Partial<Player>) => {
    try {
      const formData = new FormData()
      formData.append("playerId", playerId)
      if (updates.name !== undefined) formData.append("name", updates.name)
      if (updates.uid !== undefined) formData.append("uid", updates.uid)
      if (updates.email !== undefined) formData.append("email", updates.email)
      if (updates.gacUsername !== undefined) formData.append("gacUsername", updates.gacUsername)
      if (updates.gacPassword !== undefined) formData.append("gacPassword", updates.gacPassword)
      if (updates.gacInGameName !== undefined) formData.append("gacIngameName", updates.gacInGameName)

      const result = await updatePlayerAction({} as any, formData)
      if (result.status === "success") {
        toast.success("Player updated successfully")
        loadTeams()
        setEditingPlayer(null)
      } else {
        toast.error(result.message || "Failed to update player")
      }
    } catch (error) {
      toast.error("Failed to update player")
      console.error("Error updating player:", error)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return

    try {
      const formData = new FormData()
      formData.append("playerId", playerId)
      const result = await deletePlayerAction({} as any, formData)
      if (result.status === "success") {
        toast.success("Player deleted successfully")
        loadTeams()
      } else {
        toast.error(result.message || "Failed to delete player")
      }
    } catch (error) {
      toast.error("Failed to delete player")
      console.error("Error deleting player:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams & Players in {groupName}</CardTitle>
        <CardDescription>Manage teams and their players</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No teams found in this group</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
          {teams.map((team) => (
            <AccordionItem key={team._id} value={team._id} className="border rounded-lg px-4">
              <div className="flex">
                <div className="w-full items-center py-2 px-2 hover:bg-muted/50 rounded-md">
                  {/* Accordion Trigger - full width (flex-grow to fill all available space) */}
                  <AccordionTrigger
                    className="flex-1 flex items-center p-2 rounded-md text-left hover:no-underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm sm:text-base">Slot {team.slot}</span>
                        <span className="font-medium text-sm sm:text-base">{team.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {team.tag && <span>[{team.tag}]</span>}
                        {team.email && <span>{team.email}</span>}
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>
                  {/* Action Buttons (fixed at right corner) */}
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {/* Edit Team Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTeam(team)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                      <DialogHeader>
                        <DialogTitle>Edit Team</DialogTitle>
                        <DialogDescription>Update team information</DialogDescription>
                      </DialogHeader>
                      <TeamEditForm
                        team={editingTeam || team}
                        onSave={(updates) => handleUpdateTeam(team._id, updates)}
                        onCancel={() => setEditingTeam(null)}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTeam(team._id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {/* Accordion content stays same */}
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <h4 className="font-semibold">Players</h4>
                  {team.players.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No players in this team</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {team.players.map((player) => (
                        <div key={player._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">UID: {player.uid}</p>
                            <p className="text-sm text-muted-foreground">{player.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setEditingPlayer(player)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Player</DialogTitle>
                                  <DialogDescription>Update player information</DialogDescription>
                                </DialogHeader>
                                <PlayerEditForm
                                  player={editingPlayer || player}
                                  onSave={(updates) => handleUpdatePlayer(player._id, updates)}
                                  onCancel={() => setEditingPlayer(null)}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePlayer(player._id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

function TeamEditForm({
  team,
  onSave,
  onCancel,
}: {
  team: Team
  onSave: (updates: Partial<Team>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    slot: team.slot,
    name: team.name,
    tag: team.tag,
    email: team.email,
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Slot Number</Label>
        <Input
          type="number"
          value={formData.slot}
          onChange={(e) => setFormData({ ...formData, slot: Number.parseInt(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Team Name</Label>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Team Tag</Label>
        <Input value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)}>Save Changes</Button>
      </DialogFooter>
    </div>
  )
}

function PlayerEditForm({
  player,
  onSave,
  onCancel,
}: {
  player: Player
  onSave: (updates: Partial<Player>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: player.name,
    uid: player.uid,
    email: player.email,
    gacUsername: player.gacUsername || "",
    gacPassword: player.gacPassword || "",
    gacInGameName: player.gacInGameName || "",
    discord: {
      userName: player.discord?.userName || "",
      email: player.discord?.email || "",
      role: player.discord?.role || [],
      guild: player.discord?.guild || "",
      serverJoined: player.discord?.serverJoined || false,
      emailSent: player.discord?.emailSent || 0,
      otp: player.discord?.otp,
      sender: player.discord?.sender || "",
    },
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Player Name</Label>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>UID</Label>
        <Input value={formData.uid} onChange={(e) => setFormData({ ...formData, uid: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-4">GAC Information</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>GAC Username</Label>
            <Input
              value={formData.gacUsername}
              onChange={(e) => setFormData({ ...formData, gacUsername: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>GAC Password</Label>
            <Input
              type="password"
              value={formData.gacPassword}
              onChange={(e) => setFormData({ ...formData, gacPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>GAC In-Game Name</Label>
            <Input
              value={formData.gacInGameName}
              onChange={(e) => setFormData({ ...formData, gacInGameName: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-4">Discord Information</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Discord Username</Label>
            <Input
              value={formData.discord.userName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discord: { ...formData.discord, userName: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Discord Email</Label>
            <Input
              type="email"
              value={formData.discord.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discord: { ...formData.discord, email: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Guild ID</Label>
            <Input
              value={formData.discord.guild}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discord: { ...formData.discord, guild: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)}>Save Changes</Button>
      </DialogFooter>
    </div>
  )
}
