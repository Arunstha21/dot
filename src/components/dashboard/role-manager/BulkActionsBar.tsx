"use client"

import React, { useState } from "react"
import { Loader2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  bulkReassignRoles,
  bulkUpdateNicknames,
  bulkRemovePlayers,
} from "@/server/actions/roleManager"

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onRefresh: () => void
  stageId: string
  playerIds: string[]
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onRefresh,
  stageId,
  playerIds,
}: BulkActionsBarProps) {
  const [action, setAction] = useState<"roles" | "nicknames" | "remove" | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [roles, setRoles] = useState<string[]>([])
  const [newRole, setNewRole] = useState("")
  const [nicknameTemplate, setNicknameTemplate] = useState("{tag} | {username}")
  

  const handleBulkRoles = async () => {
    if (roles.length === 0) {
      toast.error("At least one role is required")
      return
    }

    setLoading(true)
    const result = await bulkReassignRoles(playerIds, roles)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      setShowDialog(false)
      setRoles([])
      onClearSelection()
      onRefresh()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const handleBulkNicknames = async () => {
    setLoading(true)
    const result = await bulkUpdateNicknames(playerIds, nicknameTemplate)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      setShowDialog(false)
      onClearSelection()
      onRefresh()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const handleBulkRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedCount} players?`)) {
      return
    }

    setLoading(true)
    const result = await bulkRemovePlayers(playerIds)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      setShowDialog(false)
      onClearSelection()
      onRefresh()
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
    <>
      <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            {selectedCount} player{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAction("roles")
                setShowDialog(true)
              }}
            >
              Reassign Roles
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAction("nicknames")
                setShowDialog(true)
              }}
            >
              Update Nicknames
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setAction("remove")
                setShowDialog(true)
              }}
            >
              Remove Players
            </Button>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "roles" && "Bulk Reassign Roles"}
              {action === "nicknames" && "Bulk Update Nicknames"}
              {action === "remove" && "Confirm Bulk Remove"}
            </DialogTitle>
            <DialogDescription>
              {action === "roles" &&
                `Assign new roles to ${selectedCount} selected players`}
              {action === "nicknames" &&
                `Update nicknames for ${selectedCount} selected players`}
              {action === "remove" &&
                `Remove ${selectedCount} players from role manager`}
            </DialogDescription>
          </DialogHeader>

          {action === "roles" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Roles to Assign</Label>
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
                    <Badge key={role} variant="secondary" className="px-2 py-1">
                      {role}
                      <button
                        onClick={() => removeRole(role)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {action === "nicknames" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template">Nickname Template</Label>
                <Input
                  id="template"
                  value={nicknameTemplate}
                  onChange={(e) => setNicknameTemplate(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{tag}"} for team tag and {"{username}"} for player username
                </p>
                <p className="text-xs text-muted-foreground">
                  Example: {"{tag}"} | {"{username}"} → TEAM | PlayerName
                </p>
              </div>
            </div>
          )}

          {action === "remove" && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                This action will remove {selectedCount} players from the role manager system.
                This action cannot be undone.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={
                action === "roles"
                  ? handleBulkRoles
                  : action === "nicknames"
                  ? handleBulkNicknames
                  : handleBulkRemove
              }
              disabled={loading || (action === "roles" && roles.length === 0)}
              variant={action === "remove" ? "destructive" : "default"}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
