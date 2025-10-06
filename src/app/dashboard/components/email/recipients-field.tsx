"use client"

import { useEffect } from "react"
import { Label } from "@/components/ui/label"
import { MultiEmailInput } from "../MultiEmailInput"

type Props = {
  id: string
  label: string
  emails: string[]
  setEmails: (v: string[]) => void
  required?: boolean
  hiddenPrefix?: string
}

export default function RecipientsField({ id, label, emails, setEmails, required, hiddenPrefix }: Props) {
  useEffect(() => {
    // placeholder for enhancements
  }, [emails])

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <MultiEmailInput id={id} value={emails} onChange={setEmails} placeholder={`Enter ${label.toLowerCase()}...`} required={required} />
      <div aria-hidden className="hidden">
        {emails.map((e, i) => (
          <input key={`${hiddenPrefix}-${i}-${e}`} type="hidden" name={hiddenPrefix} value={e} />
        ))}
      </div>
    </div>
  )
}
