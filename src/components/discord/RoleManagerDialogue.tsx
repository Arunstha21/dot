"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Plus, MoreVertical, Pencil, Trash2, Search, Loader2, Mail, UserCircle } from "lucide-react"
import { toast } from "sonner"
import type { IRoleManagerUser } from "@/lib/database/schema"
import { createRoleManagerUser, deleteRoleManagerUser, getRoleManagerUsers, updateRoleManagerUser } from "@/server/actions/discord-actions"
import { ScrollArea } from "../ui/scroll-area"

interface RoleManagerDialogProps {
  guild: string
  guildName: string
}

interface UserFormData {
  userName: string
  email: string
  role: string[]
  serverJoined: boolean
  emailSent: boolean
}

export function RoleManagerDialog({ guild, guildName }: RoleManagerDialogProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<IRoleManagerUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingUser, setEditingUser] = useState<IRoleManagerUser | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    userName: "",
    email: "",
    role: [],
    serverJoined: false,
    emailSent: false,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getRoleManagerUsers(guild)
      setUsers(data.users || [])
    } catch (error) {
      toast.error("Failed to load users")
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setFormData({
      userName: "",
      email: "",
      role: [],
      serverJoined: false,
      emailSent: false,
    })
    setShowUserForm(true)
  }

  const handleEditUser = (user: IRoleManagerUser) => {
    setEditingUser(user)
    setFormData({
      userName: user.userName,
      email: user.email,
      role: user.role || [],
      serverJoined: user.serverJoined || false,
      emailSent: user.emailSent > 0 || false,
    })
    setShowUserForm(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const result = await deleteRoleManagerUser(userId)
      if (result.status === "success") {
        toast.success(result.message)
        loadUsers()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to delete user")
      console.error("Error deleting user:", error)
    }
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingUser) {
        const result = await updateRoleManagerUser(editingUser._id.toString(), formData)
        if (result.status === "success") {
          toast.success(result.message)
          setShowUserForm(false)
          loadUsers()
        } else {
          toast.error(result.message)
        }
      } else {
        const result = await createRoleManagerUser({
          ...formData,
          guild,
        })
        if (result.status === "success") {
          toast.success(result.message)
          setShowUserForm(false)
          loadUsers()
        } else {
          toast.error(result.message)
        }
      }
    } catch (error) {
      toast.error(editingUser ? "Failed to update user" : "Failed to create user")
      console.error("Error submitting user:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      role: prev.role.includes(role) ? prev.role.filter((r) => r !== role) : [...prev.role, role],
    }))
  }

  const filteredUsers = users.filter(
    (user) =>
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <Users className="h-4 w-4 mr-2" />
          Manage Users
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Role Manager - {guildName}</DialogTitle>
          <DialogDescription>Manage users and their roles for this Discord server</DialogDescription>
        </DialogHeader>

        {showUserForm ? (
          <form onSubmit={handleSubmitUser} className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Username *</Label>
                  <Input
                    id="userName"
                    placeholder="Enter username"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Roles</Label>
                  <div className="space-y-2">
                    {["Player", "Owner", "Admin", "Moderator"].map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={formData.role.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <Label htmlFor={`role-${role}`} className="font-normal cursor-pointer">
                          {role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="serverJoined"
                      checked={formData.serverJoined}
                      onCheckedChange={(checked) => setFormData({ ...formData, serverJoined: checked as boolean })}
                    />
                    <Label htmlFor="serverJoined" className="font-normal cursor-pointer">
                      Server Joined
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailSent"
                      checked={formData.emailSent}
                      onCheckedChange={(checked) => setFormData({ ...formData, emailSent: checked as boolean })}
                    />
                    <Label htmlFor="emailSent" className="font-normal cursor-pointer">
                      Email Sent
                    </Label>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowUserForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingUser ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{editingUser ? "Update User" : "Create User"}</>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleCreateUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          {searchQuery ? "No users found matching your search" : "No users yet. Add your first user!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user._id.toString()}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{user.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.role && user.role.length > 0 ? (
                                user.role.map((role) => (
                                  <Badge key={role} variant="secondary" className="text-xs">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">No roles</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.serverJoined && (
                                <Badge variant="outline" className="text-xs">
                                  Joined
                                </Badge>
                              )}
                              {user.emailSent && (
                                <Badge variant="outline" className="text-xs">
                                  Email Sent
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user._id.toString())}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
              <span>Total Users: {users.length}</span>
              <span>Showing: {filteredUsers.length}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
