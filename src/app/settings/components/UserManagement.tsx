"use client"

import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Shield, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { updateUserAction, deleteUserAction, createUserAction, type ActionResult } from "@/server/actions/users-actions"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const addUserSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  superUser: z.boolean(),
})

type AddUserSchemaT = z.infer<typeof addUserSchema>

export default function UsersManagement({ initialUsers }: { initialUsers: any[] }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const [updateState, updateUser] = useActionState<ActionResult, FormData>(updateUserAction, { status: "success" })
  const [deleteState, deleteUser] = useActionState<ActionResult, FormData>(deleteUserAction, { status: "success" })
  const [createState, createUser, createPending] = useActionState<ActionResult, FormData>(createUserAction, {
    status: "success",
  })

  const form = useForm<AddUserSchemaT>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { userName: "", email: "", password: "", superUser: false },
  })

  useEffect(() => {
    if (updateState?.status === "error") toast.error(updateState.message)
    if (updateState?.status === "success" && updateState.message) {
      toast.success(updateState.message)
      setEditDialogOpen(false)
    }
  }, [updateState])

  useEffect(() => {
    if (deleteState?.status === "error") toast.error(deleteState.message)
    if (deleteState?.status === "success" && deleteState.message) toast.success(deleteState.message)
  }, [deleteState])

  useEffect(() => {
    if (createState?.status === "error") toast.error(createState.message)
    if (createState?.status === "success" && createState.message) {
      toast.success(createState.message)
      form.reset()
      setCreateDialogOpen(false)
    }
  }, [createState, form])

  const onSubmit = async (data: AddUserSchemaT) => {
    const fd = new FormData()
    fd.append("userName", data.userName)
    fd.append("email", data.email)
    fd.append("password", data.password)
    if (data.superUser) fd.append("superUser", "true")
    await createUser(fd)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="superUser"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Super User</FormLabel>
                          <p className="text-sm text-muted-foreground">Grant administrator privileges to this user</p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createPending}>
                    {createPending ? "Creating..." : "Create User"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {initialUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No users found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.superUser ? (
                      <span className="flex items-center gap-1 text-primary">
                        <Shield className="h-4 w-4" />
                        Super User
                      </span>
                    ) : (
                      "User"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editDialogOpen && selectedUser?._id === user._id}
                        onOpenChange={(open) => {
                          setEditDialogOpen(open)
                          if (!open) setSelectedUser(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Update user information and permissions</DialogDescription>
                          </DialogHeader>
                          <form action={updateUser} className="space-y-4 py-4">
                            <input type="hidden" name="id" value={user._id} />

                            <div>
                              <Label>Username</Label>
                              <Input defaultValue={user.userName} disabled />
                              <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
                            </div>

                            <div>
                              <Label>Email</Label>
                              <Input defaultValue={user.email} disabled />
                              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                              <Label htmlFor="password">New Password (optional)</Label>
                              <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Leave blank to keep current"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="superUser">Super User Permissions</Label>
                              <Switch id="superUser" name="superUser" defaultChecked={user.superUser} />
                            </div>

                            <Button type="submit" className="w-full">
                              Save Changes
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <form
                        action={deleteUser}
                        onSubmit={(e) => {
                          if (!confirm(`Delete user ${user.userName}?`)) e.preventDefault()
                        }}
                      >
                        <input type="hidden" name="id" value={user._id} />
                        <Button size="sm" variant="destructive" type="submit">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
