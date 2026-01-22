"use client"

import React, { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  addPlayerToRoleManager,
} from "@/server/actions/roleManager"
import {
  getTeamsByGroup,
} from "@/server/actions/teams-actions"

interface AddPlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
  onPlayerAdded: () => void
}

export function AddPlayerDialog({
  open,
  onOpenChange,
  stageId,
  onPlayerAdded,
}: AddPlayerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [newRole, setNewRole] = useState("")
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userName || !email) {
      toast.error("Username and email are required")
      return
    }

    if (roles.length === 0) {
      toast.error("At least one role is required")
      return
    }

    setLoading(true)
    const result = await addPlayerToRoleManager(stageId, {
      userName,
      email,
      role: roles,
    })
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      setUserName("")
      setEmail("")
      setRoles([])
      onOpenChange(false)
      onPlayerAdded()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const addRole = () => {
    if (newRole && !roles.includes(newRole)) {
      setRoles([...roles, newRole])
      setNewRole("")
    }
  }

  const removeRole = (role: string) => {
    setRoles(roles.filter((r) => r !== role))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Player to Role Manager</DialogTitle>
          <DialogDescription>
            Add a new player to the role manager system. They will receive a verification email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Discord Username</Label>
            <Input
              id="userName"
              placeholder="username#1234"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Discord Roles to Assign</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter role name..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
                disabled={loading}
              />
              <Button type="button" onClick={addRole} disabled={!newRole} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {roles.map((role) => (
                <div
                  key={role}
                  className="bg-secondary px-2 py-1 rounded-md text-sm flex items-center gap-1"
                >
                  {role}
                  <button
                    type="button"
                    onClick={() => removeRole(role)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {roles.length === 0 && (
              <p className="text-xs text-muted-foreground">At least one role is required</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Add Player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
