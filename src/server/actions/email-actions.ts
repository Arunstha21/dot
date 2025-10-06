"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { sendEmail } from "@/server/sendgrid"

type EmailActionState = {
  status: "idle" | "success" | "error"
  message?: string
}

export async function sendGeneralEmailAction(_: EmailActionState, formData: FormData): Promise<EmailActionState> {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) return { status: "error", message: "Unauthorized" }

    const from = String(formData.get("from") || "")
    const subject = String(formData.get("subject") || "")
    const message = String(formData.get("message") || "")

    const tos = formData.getAll("tos").map(String).filter(Boolean)
    const bccs = formData.getAll("bccs").map(String).filter(Boolean)

    if (!from) return { status: "error", message: "Sender is required" }
    if (!subject) return { status: "error", message: "Subject is required" }
    if (!message) return { status: "error", message: "Message is empty" }
    if (tos.length === 0 && bccs.length === 0) {
      return { status: "error", message: "Provide at least one recipient (To or BCC)" }
    }

    await sendEmail({ from, tos, bccs, subject, message })
    return { status: "success", message: "Email sent successfully!" }
  } catch (err: any) {
    return { status: "error", message: err?.message || "Failed to send email" }
  }
}

export async function sendEventEmailAction(_: EmailActionState, formData: FormData): Promise<EmailActionState> {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) return { status: "error", message: "Unauthorized" }

    const from = String(formData.get("from") || "")
    const subject = String(formData.get("subject") || "")
    const message = String(formData.get("message") || "")

    const tos = formData.getAll("tos").map(String).filter(Boolean)
    const bccs = formData.getAll("bccs").map(String).filter(Boolean)

    if (!from) return { status: "error", message: "Sender is required" }
    if (!subject) return { status: "error", message: "Subject is required" }
    if (!message) return { status: "error", message: "Message is empty" }
    if (bccs.length === 0) return { status: "error", message: "At least one BCC recipient is required" }

    await sendEmail({ from, tos, bccs, subject, message })
    return { status: "success", message: "Event email sent successfully!" }
  } catch (err: any) {
    return { status: "error", message: err?.message || "Failed to send event email" }
  }
}
