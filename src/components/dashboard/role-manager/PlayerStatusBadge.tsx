"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import type { RoleManagerPlayerData } from "@/server/actions/roleManager"

interface PlayerStatusBadgeProps {
  player: RoleManagerPlayerData
}

export function PlayerStatusBadge({ player }: PlayerStatusBadgeProps) {
  if (player.serverJoined) {
    return (
      <Badge variant="default" className="bg-green-600">
        Verified
      </Badge>
    )
  }

  if (player.emailSent > 0) {
    return (
      <Badge variant="outline" className="border-yellow-600 text-yellow-600">
        Pending ({player.emailSent}/3)
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      Not Started
    </Badge>
  )
}
