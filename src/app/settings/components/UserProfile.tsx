"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { User, Mail, Shield } from "lucide-react"

type UserProfileProps = {
  user: {
    name?: string | null
    email?: string | null
    superUser?: boolean
  }
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Username</div>
              <div className="text-sm text-muted-foreground">{user.name || "N/A"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{user.email || "N/A"}</div>
            </div>
          </div>

          {user.superUser && (
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Role</div>
                <div className="text-sm text-primary">Super User</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/settings/change-password">Change Password</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
