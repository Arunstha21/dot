"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function UserSettings() {
  const { data } = useSession()
  const user = data?.user

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          <div className="font-medium">Username</div>
          <div>{user?.name}</div>
        </div>
        <div className="text-sm">
          <div className="font-medium">Email</div>
          <div>{user?.email}</div>
        </div>
        <div className="pt-2">
          <Button asChild>
            <Link href="/settings/change-password">Change Password</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
