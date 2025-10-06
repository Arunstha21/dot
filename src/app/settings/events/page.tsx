'use server';

import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { redirect } from "next/navigation"
import EventsManager from "./ui"
import { listAllHierarchy } from "@/server/actions/events-actions"

export default async function EventsSettingsPage() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.superUser) redirect("/settings")

  const initial = await listAllHierarchy()
  return <EventsManager initial={initial} />
}
