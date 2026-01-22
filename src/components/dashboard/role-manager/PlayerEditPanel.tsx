"use client"

import React, { useState } from "react"
import { Loader2, X, Save, Mail, UserCheck } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  updatePlayerEmail,
  updatePlayerNickname,
  reassignPlayerRoles,
  resendVerificationEmail,
  manualVerifyPlayer,
  type RoleManagerPlayerData,
} from "@/server/actions/roleManager"

interface PlayerEditPanelProps {
  player: RoleManagerPlayerData
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function PlayerEditPanel({
  player,
  open,
  onOpenChange,
  onUpdate,
}: PlayerEditPanelProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(player.email)
  const [nickname, setNickname] = useState("")
  const [roles, setRoles] = useState<string[]>(player.role)
  

  const handleSaveEmail = async () => {
    setLoading(true)
    const result = await updatePlayerEmail(player._id, email)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      onUpdate()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const handleSaveNickname = async () => {
    setLoading(true)
    const result = await updatePlayerNickname(player._id, nickname)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      setNickname("")
    } else {
      toast.error(result.message || "Error")
    }
  }

  const handleSaveRoles = async () => {
    setLoading(true)
    const result = await reassignPlayerRoles(player._id, roles)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      onUpdate()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    const result = await resendVerificationEmail(player._id)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      onUpdate()
    } else {
      toast.error(result.message || "Error")
    }
  }

  const handleManualVerify = async () => {
    setLoading(true)
    const result = await manualVerifyPlayer(player._id)
    setLoading(false)

    if (result.status === "success") {
      toast.success(result.message || "Success")
      onUpdate()
    } else {
      toast.error(result.message || "Error")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Player</SheetTitle>
          <SheetDescription>
            Manage player details, roles, and verification status
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Player Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Discord Tag</Label>
              <p className="font-medium">{player.userName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Team</Label>
              <p className="font-medium">{player.team?.name || "No team"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Current Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {player.serverJoined ? (
                  <Badge variant="default" className="bg-green-600">Verified</Badge>
                ) : player.emailSent > 0 ? (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-600">Pending</Badge>
                ) : (
                  <Badge variant="secondary">Not Started</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Email Update */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handleSaveEmail} disabled={loading} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Warning: Updating email will reset verification status
            </p>
          </div>

          {/* Nickname Update */}
          <div className="space-y-2">
            <Label htmlFor="nickname">New Nickname (with team tag)</Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                placeholder={`${player.team?.tag || "TEAM"} | username`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handleSaveNickname} disabled={loading || !nickname} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label>Discord Roles</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="px-2 py-1">
                  {role}
                  <button
                    onClick={() => setRoles(roles.filter((r) => r !== role))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add role..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const target = e.target as HTMLInputElement
                    if (target.value && !roles.includes(target.value)) {
                      setRoles([...roles, target.value])
                      target.value = ""
                    }
                  }
                }}
                disabled={loading}
              />
              <Button onClick={handleSaveRoles} disabled={loading} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          {!player.serverJoined && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Quick Actions</Label>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleResendEmail}
                  disabled={loading || player.emailSent >= 3}
                  variant="outline"
                  className="justify-start"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Button>
                <Button
                  onClick={handleManualVerify}
                  disabled={loading}
                  variant="outline"
                  className="justify-start"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Manually Verify Player
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
