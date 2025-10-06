import { IUser, User } from "@/lib/database/user"
import { dbConnect } from "@/lib/db"

export async function getUserByUserNameOrEmail(userNameOrEmail: string) {
  await dbConnect()
  const user = await User.findOne({
    $or: [{ userName: userNameOrEmail }, { email: userNameOrEmail }],
  })
  return user
}

export async function listUsers() {
  await dbConnect()
  const users = await User.find().sort({ createdAt: -1 }).lean()

  return users.map((u) => ({
    ...u,
    _id: (u._id as string | { toString(): string }).toString(),
    createdAt: u.createdAt?.toISOString(),
    updatedAt: u.updatedAt?.toISOString(),
  }))
}

export async function createUser(userName: string, email: string, passwordHash: string, superUser: boolean) {
  await dbConnect()
  const user = new User({ userName, email, password: passwordHash, superUser })
  await user.save()
  return user
}

export async function updateUser(id: string, patch: Partial<IUser>) {
  await dbConnect()
  return User.findByIdAndUpdate(id, patch, { new: true })
}

export async function deleteUserById(id: string) {
  await dbConnect()
  return User.findByIdAndDelete(id)
}
