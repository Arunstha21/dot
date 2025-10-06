"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { createUser, deleteUserById, listUsers, updateUser } from "@/server/user-model"
import { revalidatePath } from "next/cache"

export type ActionResult = { status: "success"; message?: string } | { status: "error"; message: string }

const createUserSchema = z.object({
  userName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  superUser: z.coerce.boolean().optional().default(false),
})

export async function createUserAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }

  const parsed = createUserSchema.safeParse({
    userName: formData.get("userName"),
    email: formData.get("email"),
    password: formData.get("password"),
    superUser: formData.get("superUser"),
  })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    await createUser(parsed.data.userName, parsed.data.email, passwordHash, !!parsed.data.superUser)
    revalidatePath("/admin/users")
    return { status: "success", message: "User created" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to create user" }
  }
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  superUser: z.coerce.boolean().optional(),
  password: z.string().min(8).optional(),
})

export async function updateUserAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    superUser: formData.get("superUser"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }

  try {
    const patch: any = {}
    if (typeof parsed.data.superUser !== "undefined") patch.superUser = parsed.data.superUser
    if (parsed.data.password) patch.passwordHash = await bcrypt.hash(parsed.data.password, 10)
    await updateUser(parsed.data.id, patch)
    revalidatePath("/admin/users")
    return { status: "success", message: "User updated" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to update user" }
  }
}

export async function deleteUserAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) return { status: "error", message: "Forbidden" }

  const id = String(formData.get("id") || "")
  if (!id) return { status: "error", message: "Missing id" }
  try {
    await deleteUserById(id)
    revalidatePath("/admin/users")
    return { status: "success", message: "User deleted" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to delete user" }
  }
}

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function changePasswordAction(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authConfig)
  if (!session?.user) return { status: "error", message: "Unauthorized" }

  const parsed = changePasswordSchema.safeParse({
    oldPassword: formData.get("oldPassword"),
    newPassword: formData.get("newPassword"),
  })
  if (!parsed.success) return { status: "error", message: "Invalid fields" }

  try {
    const { getUserByUserNameOrEmail, updateUser } = await import("@/server/user-model")
    const user = await getUserByUserNameOrEmail(session.user.email || session.user.name || "")
    if (!user) return { status: "error", message: "User not found" }

    const ok = await bcrypt.compare(parsed.data.oldPassword, user.password)
    if (!ok) return { status: "error", message: "Current password incorrect" }

    const hash = await bcrypt.hash(parsed.data.newPassword, 10)
    await updateUser(user._id.toString(), { password: hash })
    return { status: "success", message: "Password changed" }
  } catch (e: any) {
    return { status: "error", message: e?.message || "Failed to change password" }
  }
}

// For server component fetch
export async function listUsersServer() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) throw new Error("Forbidden")
  const users = await listUsers()
  return users as any[]
}
