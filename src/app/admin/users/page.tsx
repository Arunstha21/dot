import UsersAdminClient from "./component/users-admin-client"
import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { redirect } from "next/navigation"
import { listUsersServer } from "@/server/actions/users-actions"

type User = {
  _id: string
  userName: string
  email: string
  superUser: boolean
}

export default async function UsersAdminPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) redirect("/dashboard/new")

  const users = await listUsersServer()
  return <UsersAdminClient initialUsers={users as User[]} />
}
