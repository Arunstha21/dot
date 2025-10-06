"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createUserAction, updateUserAction, deleteUserAction, type ActionResult } from "@/server/actions/users-actions"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Shield, Key, Trash2, Users } from "lucide-react"

type User = { _id: string; userName: string; email: string; superUser: boolean }

export default function UsersAdminClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter()
  const [createState, createAction, createPending] = useActionState<ActionResult, FormData>(createUserAction, {
    status: "success",
  })
  const [updateState, updateAction] = useActionState<ActionResult, FormData>(updateUserAction, { status: "success" })
  const [deleteState, deleteAction] = useActionState<ActionResult, FormData>(deleteUserAction, { status: "success" })

  useEffect(() => {
    for (const s of [createState, updateState, deleteState]) {
      if (s?.status === "error") toast.error(s.message)
      if (s?.status === "success" && s.message) {
        toast.success(s.message)
        router.refresh()
      }
    }
  }, [createState, updateState, deleteState, router])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
        </div>

        {/* Create User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAction} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="userName">User Name</Label>
                  <Input id="userName" name="userName" placeholder="Enter username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="user@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Enter password" />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox id="superUser" name="superUser" />
                  <Label htmlFor="superUser" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Super Administrator
                  </Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={createPending} className="min-w-32">
                  {createPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
                <p className="text-sm text-muted-foreground">Create your first user using the form above</p>
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

                        <form
                          action={updateAction}
                          onSubmit={(e) => {
                            const pwd = prompt("Enter a new password for this user")
                            if (!pwd) {
                              e.preventDefault()
                              return
                            }
                            const idInput = document.createElement("input")
                            idInput.type = "hidden"
                            idInput.name = "id"
                            idInput.value = user._id
                            e.currentTarget.appendChild(idInput)
                            const pwdInput = document.createElement("input")
                            pwdInput.type = "hidden"
                            pwdInput.name = "password"
                            pwdInput.value = pwd
                            e.currentTarget.appendChild(pwdInput)
                          }}
                        >
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 bg-transparent"
                          >
                            <Key className="h-4 w-4" />
                            Reset Password
                          </Button>
                        </form>

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
