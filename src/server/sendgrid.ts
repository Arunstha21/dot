'use server';

import sgClient from "@sendgrid/client"
import sgMail from "@sendgrid/mail"

export type from = { email: string; name?: string }

const apiKey = process.env.SENDGRID_API_KEY

if (apiKey) {
  sgClient.setApiKey(apiKey)
  sgMail.setApiKey(apiKey)
}

export async function getEmailList(): Promise<from[]> {
  if (!apiKey) return []
  try {
    const [, body] = await sgClient.request({
      method: "GET",
      url: "/v3/verified_senders",
    } as any)
    const senders = (body?.results || []) as any[]
    return senders.map((s) => ({ email: s.from_email || s.nickname, name: s.from_name || s.nickname })).filter(Boolean)
  } catch {
    return []
  }
}

export async function sendEmail({
  from,
  tos,
  bccs,
  subject,
  message,
}: {
  from: string
  tos: string[]
  bccs: string[]
  subject: string
  message: string
}) {
  if (!apiKey) throw new Error("SENDGRID_API_KEY not set")
  const to = (tos || []).map((e) => ({ email: e }))
  const bcc = (bccs || []).map((e) => ({ email: e }))

  await sgMail.send({
    from,
    to: to.length ? to : undefined,
    bcc: bcc.length ? bcc : undefined,
    subject,
    html: message,
  } as any)

  
}
