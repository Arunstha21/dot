"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { updateUserAction, deleteUserAction, type ActionResult } from "@/server/actions/users-actions"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Trash2, Users } from "lucide-react"
import { CreateUserDialog } from "./create-user-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"

type User = { _id: string; userName: string; email: string; superUser: boolean }

export default function UsersAdminClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter()
  const [updateState, updateAction] = useActionState<ActionResult, FormData>(updateUserAction, { status: "success" })
  const [deleteState, deleteAction] = useActionState<ActionResult, FormData>(deleteUserAction, { status: "success" })

  useEffect(() => {
    for (const s of [updateState, deleteState]) {
      if (s?.status === "error") toast.error(s.message)
      if (s?.status === "success" && s.message) {
        toast.success(s.message)
        router.refresh()
      }
    }
  }, [updateState, deleteState, router])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
          </div>
          <CreateUserDialog />
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Existing Users ({initialUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {initialUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No users found</p>
                <p className="text-sm text-muted-foreground">Create your first user using the button above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {initialUsers.map((user, index) => (
                  <div key={user._id}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-lg border bg-card/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{user.userName}</h3>
                          {user.superUser && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <form action={updateAction}>
                          <input type="hidden" name="id" value={user._id} />
                          <input type="hidden" name="superUser" value={(!user.superUser).toString()} />
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 bg-transparent"
                          >
                            <Shield className="h-4 w-4" />
                            {user.superUser ? "Revoke Admin" : "Make Admin"}
                          </Button>
                        </form>

                        <ResetPasswordDialog userId={user._id} userName={user.userName} />

                        <form
                          action={deleteAction}
                          onSubmit={(e) => {
                            if (!confirm(`Are you sure you want to delete user "${user.userName}"?`)) {
                              e.preventDefault()
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={user._id} />
                          <Button type="submit" variant="destructive" size="sm" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>
                    {index < initialUsers.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
