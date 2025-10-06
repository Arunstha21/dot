import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      superUser: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    superUser: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    email: string
    superUser: boolean
  }
}
