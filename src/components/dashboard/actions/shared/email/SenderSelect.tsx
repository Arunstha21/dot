"use client"

import { useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { from } from "@/server/sendgrid"

type Props = {
  id?: string
  emailList: from[]
  value: string
  onChange: (email: string) => void
  disabled?: boolean
}

export default function SenderSelect({ id = "from", emailList, value, onChange, disabled }: Props) {
  const placeholder = useMemo(() => {
    const picked = emailList.find(e => e.email === value)
    return picked ? (picked.name ? `${picked.name} <${picked.email}>` : picked.email) : "Select sender"
  }, [emailList, value])

  return (
    <div className="grid w-full gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">From</label>
      <Select onValueChange={onChange} value={value} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emailList.map((sender) => (
            <SelectItem key={sender.email} value={sender.email}>
              {sender.name ? `${sender.name} <${sender.email}>` : sender.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="from" value={value} />
    </div>
  )
}
