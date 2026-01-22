"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import ThemeToggle from "@/components/theme-toggle"
import { Eye, EyeOff, ShieldCheck, Mail, Trophy } from "lucide-react"
import * as z from "zod"

const loginSchema = z.object({
  userName: z.string().min(1, { message: "Please enter a valid user name." }),
  password: z.string().min(1, { message: "Password must be entered." }),
})

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userName: "", password: "" },
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    const toastLoadingId = toast.loading("Logging in...")
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        userName: data.userName,
        password: data.password,
      })
      toast.dismiss(toastLoadingId)
      if (res?.error) {
        console.log("Login error:", res)
        toast.error(res.error)
        setLoading(false)
        return
      }
      toast.success("Login successful")
      router.push("/dashboard/compose-new")
    } catch {
      toast.error("Failed to log in. Please try again.")
      toast.dismiss(toastLoadingId)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/40 to-background" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col p-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
                D
              </div>
              <div className="text-xl font-semibold tracking-tight">DOT (PUBGM)</div>
            </div>
          </header>

          <div className="mt-auto mb-16 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight">Tournament Ops, streamlined.</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Sign in to manage events, send match credentials, and publish results with a single dashboard.
            </p>

            <div className="mt-8 grid gap-4">
              <FeaturePill icon={<ShieldCheck className="h-4 w-4" />}>Secure admin access</FeaturePill>
              <FeaturePill icon={<Mail className="h-4 w-4" />}>SendGrid-powered mailer</FeaturePill>
              <FeaturePill icon={<Trophy className="h-4 w-4" />}>Live results aggregation</FeaturePill>
            </div>
          </div>

          <footer className="mt-auto text-xs text-muted-foreground">© {new Date().getFullYear()} DOT Esports</footer>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <Card className="shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Sign in to your admin account</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your user name" autoComplete="username" {...field} />
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
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((s) => !s)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Having trouble? Contact your super admin.
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturePill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-sm">
      <span className="text-primary">{icon}</span>
      <span>{children}</span>
    </div>
  )
}
