
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { getUserByUserNameOrEmail } from "@/server/user-model"
import { z } from "zod"
import type { NextAuthOptions } from "next-auth"

const credentialsSchema = z.object({
  userName: z.string().min(1),
  password: z.string().min(1),
})

export const authConfig: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        userName: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) throw new Error("Invalid credentials")
        const { userName, password } = parsed.data
        const user = await getUserByUserNameOrEmail(userName)
        
        if (!user) throw new Error("User not found")
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) throw new Error("Incorrect credentials")
        return { id: user._id.toString(), name: user.userName, email: user.email, superUser: user.superUser } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.name = user.name ?? ""
        token.email = user.email ?? ""
        token.superUser = (user as any).superUser
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        ;(session.user as any).superUser = token.superUser as boolean
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
