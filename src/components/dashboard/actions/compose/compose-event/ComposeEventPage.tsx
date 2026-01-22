"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComposeEventForm } from "./ComposeEventForm"

export default function ComposeEventPage() {
  const [shake, setShake] = useState(false)

  function shakeForm() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  return (
    <div className="container mx-auto py-8">
      <Card className={`w-full max-w-6xl mx-auto ${shake ? "animate-shake" : ""}`}>
        <CardHeader>
          <CardTitle>Send Event Email</CardTitle>
          <CardDescription>Compose and send emails for esports events</CardDescription>
        </CardHeader>
        <CardContent>
          <ComposeEventForm />
        </CardContent>
      </Card>
    </div>
  )
}
