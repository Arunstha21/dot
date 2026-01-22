"use client"

import { forwardRef, useEffect } from "react"
import { sanitizeEditableHtml } from "@/lib/email/utils"

type Props = {
  html: string | null
  label?: string
}

// Wraps preview HTML and mirrors sanitized content into a hidden input for form post
const MessagePreview = forwardRef<HTMLDivElement, Props>(function MessagePreview({ html, label = "Message Preview" }, ref) {
  useEffect(() => {
    // No-op; consumers control html
  }, [html])

  const sanitized = sanitizeEditableHtml(html || "")

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-2 p-4 border rounded-md max-h-[600px] overflow-auto">
        <div ref={ref as any} dangerouslySetInnerHTML={{ __html: sanitized }} />
      </div>
      <input type="hidden" name="message" value={sanitized} />
    </div>
  )
})

export default MessagePreview
