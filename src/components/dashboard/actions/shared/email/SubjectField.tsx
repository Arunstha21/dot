"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  id?: string
  subject: string
  setSubject: (v: string) => void
}

export default function SubjectField({ id = "subject", subject, setSubject }: Props) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={id}>Subject</Label>
      <Input id={id} value={subject} onChange={(e) => setSubject(e.target.value)} required />
      <input type="hidden" name="subject" value={subject} />
    </div>
  )
}
