"use client"

import React, { useState } from "react"
import { Loader2, Save, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  updatePlayerGAC,
  deletePlayerGAC,
} from "@/server/actions/gac"
import type { PlayerGACData } from "@/server/actions/gac"

interface GACEditDialogProps {
  player: PlayerGACData
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function GACEditDialog({
  player,
  open,
  onOpenChange,
  onUpdate,
}: GACEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [gacUsername, setGacUsername] = useState(player.gacUsername || "")
  const [gacPassword, setGacPassword] = useState(player.gacPassword || "")
  const [gacIngameName, setGacIngameName] = useState(player.gacIngameName || "")
  

  const handleSave = async () => {
    setLoading(true)
    const result = await updatePlayerGAC(player._id, {
      gacUsername: gacUsername || undefined,
      gacPassword: gacPassword || undefined,
      gacIngameName: gacIngameName || undefined,
    })
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      onOpenChange(false)
      onUpdate()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this player's GAC credentials?")) {
      return
    }

    setLoading(true)
    const result = await deletePlayerGAC(player._id)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      onOpenChange(false)
      onUpdate()
    } else {
      toast.error(result.message || "Error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit GAC Credentials</DialogTitle>
          <DialogDescription>
            Update Garena Account Credentials for {player.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name</Label>
            <Input id="playerName" value={player.name} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingameName">In-Game Name</Label>
            <Input
              id="ingameName"
              value={gacIngameName}
              onChange={(e) => setGacIngameName(e.target.value)}
              placeholder="Enter in-game name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">GAC Username</Label>
            <Input
              id="username"
              value={gacUsername}
              onChange={(e) => setGacUsername(e.target.value)}
              placeholder="Enter GAC username"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">GAC Password</Label>
            <Input
              id="password"
              type="password"
              value={gacPassword}
              onChange={(e) => setGacPassword(e.target.value)}
              placeholder="Enter GAC password"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Password will be displayed in plain text to administrators
            </p>
          </div>

          {player.email && (
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{player.email}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {player.gacUsername && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
