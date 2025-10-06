"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { changePasswordAction, type ActionResult } from "@/server/actions/users-actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ChangePasswordForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(changePasswordAction, {
    status: "success",
  })

  useEffect(() => {
    if (state?.status === "error") {
      toast.error(state.message)
    }
    if (state?.status === "success" && state.message) {
      toast.success(state.message)
      // Redirect back to settings after successful password change
      setTimeout(() => {
        router.push("/settings")
      }, 1500)
    }
  }, [state, router])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Settings
            </Link>
          </Button>
        </div>
        <CardTitle>Change Your Password</CardTitle>
        <CardDescription>Enter your current password and choose a new one</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="oldPassword">Current Password</Label>
            <Input id="oldPassword" name="oldPassword" type="password" required autoComplete="current-password" />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters long</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
