import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { redirect } from "next/navigation"
import ChangePasswordForm from "../components/ChangePassword"

export default async function ChangePasswordPage() {
  const session = await getServerSession(authConfig)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Change Password</h1>
          <p className="text-muted-foreground mt-2">Update your account password</p>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
