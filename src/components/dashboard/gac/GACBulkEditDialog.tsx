"use client"

import React, { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { bulkUpdateTeamGAC } from "@/server/actions/gac"
import { getTeamsWithGAC, type TeamGACData, type PlayerGACData } from "@/server/actions/gac"

interface GACBulkEditDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

interface PlayerUpdate {
  _id: string
  name: string
  uid: string
  gacIngameName: string
  gacUsername: string
  gacPassword: string
}

export function GACBulkEditDialog({
  teamId,
  open,
  onOpenChange,
  onUpdate,
}: GACBulkEditDialogProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teamData, setTeamData] = useState<TeamGACData | null>(null)
  const [updates, setUpdates] = useState<Map<string, PlayerUpdate>>(new Map())

  // Load team data when dialog opens
  useEffect(() => {
    if (open) {
      loadTeamData()
    }
  }, [open, teamId])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      // Get all teams and find the specific one
      const response = await fetch(`/api/gac/team/${teamId}`)
      if (!response.ok) {
        throw new Error("Failed to load team data")
      }
      const data = await response.json()
      setTeamData(data)

      // Initialize updates map with current values
      const initialUpdates = new Map<string, PlayerUpdate>()
      data.players.forEach((player: PlayerGACData) => {
        initialUpdates.set(player._id, {
          _id: player._id,
          name: player.name,
          uid: player.uid,
          gacIngameName: player.gacIngameName || "",
          gacUsername: player.gacUsername || "",
          gacPassword: player.gacPassword || "",
        })
      })
      setUpdates(initialUpdates)
    } catch (error) {
      console.error("Error loading team data:", error)
      toast.error("Failed to load team data")
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (playerId: string, field: keyof PlayerUpdate, value: string) => {
    setUpdates((prev) => {
      const next = new Map(prev)
      const player = next.get(playerId)
      if (player) {
        next.set(playerId, { ...player, [field]: value })
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Convert updates map to array and filter only changed values
      const updateArray = Array.from(updates.values())
        .filter((update) => {
          const original = teamData?.players.find((p) => p._id === update._id)
          return (
            update.gacUsername !== (original?.gacUsername || "") ||
            update.gacPassword !== (original?.gacPassword || "") ||
            update.gacIngameName !== (original?.gacIngameName || "")
          )
        })
        .map((update) => ({
          playerId: update._id,
          gacUsername: update.gacUsername || undefined,
          gacPassword: update.gacPassword || undefined,
          gacIngameName: update.gacIngameName || undefined,
        }))

      const result = await bulkUpdateTeamGAC(updateArray)
      if (result.status === "success") {
        toast.success(result.message || "GAC credentials updated successfully")
        onOpenChange(false)
        onUpdate()
      } else {
        toast.error(result.message || "Failed to update GAC credentials")
      }
    } catch (error) {
      console.error("Error saving GAC data:", error)
      toast.error("Failed to save GAC credentials")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (loading || !teamData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Loading Team Data</DialogTitle>
            <DialogDescription>
              Please wait while we load the team information...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Edit GAC Credentials - {teamData.name}</DialogTitle>
              <DialogDescription className="mt-1">
                Bulk update Garena Account credentials for all{" "}
                <Badge variant="secondary">{teamData.players.length}</Badge> players
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player Name</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>In-Game Name</TableHead>
                <TableHead>GAC Username</TableHead>
                <TableHead>GAC Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData.players.map((player) => {
                const update = updates.get(player._id)
                if (!update) return null

                return (
                  <TableRow key={player._id}>
                    <TableCell className="font-medium">{update.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{update.uid}</code>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={update.gacIngameName}
                        onChange={(e) =>
                          handleFieldChange(player._id, "gacIngameName", e.target.value)
                        }
                        placeholder="Enter in-game name"
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={update.gacUsername}
                        onChange={(e) =>
                          handleFieldChange(player._id, "gacUsername", e.target.value)
                        }
                        placeholder="Enter GAC username"
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={update.gacPassword}
                        onChange={(e) =>
                          handleFieldChange(player._id, "gacPassword", e.target.value)
                        }
                        placeholder="Enter GAC password"
                        className="h-9"
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Tip: Leave fields empty to keep existing values
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save All Changes"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
