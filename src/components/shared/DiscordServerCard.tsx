"use client"

import React from "react"
import { MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DiscordServerCardProps {
  guildName?: string
  guildId?: string
  connected?: boolean
  className?: string
}

export function DiscordServerCard({
  guildName,
  guildId,
  connected = true,
  className = "",
}: DiscordServerCardProps) {
  return (
    <div className={`bg-card rounded-lg border p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Discord Server</h3>
      </div>
      <div className="space-y-3">
        {guildName ? (
          <div>
            <div className="text-sm text-muted-foreground">Server Name</div>
            <div className="text-lg font-semibold">{guildName}</div>
          </div>
        ) : (
          <div className="text-muted-foreground italic">Not connected</div>
        )}
        {guildId && (
          <div>
            <div className="text-sm text-muted-foreground">Guild ID</div>
            <div className="text-sm font-mono text-muted-foreground">{guildId}</div>
          </div>
        )}
        {connected && guildName && (
          <div className="pt-2">
            <Badge variant="default" className="bg-green-600">
              ✓ Connected
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
