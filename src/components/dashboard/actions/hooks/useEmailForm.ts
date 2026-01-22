import { useState, useCallback } from "react"
import { useActionState } from "react"
import { sendGeneralEmailAction } from "@/server/actions/email-actions"
import { getEmailList, type from } from "@/server/sendgrid"
import { toast } from "sonner"

interface UseEmailFormProps {
  onSuccess?: () => void
  onError?: () => void
}

interface UseEmailFormReturn {
  // State
  to: string[]
  setTo: (emails: string[]) => void
  bcc: string[]
  setBcc: (emails: string[]) => void
  subject: string
  setSubject: (subject: string) => void
  message: string
  setMessage: (message: string) => void
  selectedSender: string
  setSelectedSender: (sender: string) => void
  emailList: from[]

  // Action state
  state: { status: "idle" | "success" | "error"; message?: string }
  action: (formData: FormData) => void
  isPending: boolean

  // Utilities
  senderProps: {
    emailList: from[]
    value: string
    onChange: (email: string) => void
  }
  toProps: {
    id: string
    label: string
    emails: string[]
    setEmails: (emails: string[]) => void
    required: boolean
    hiddenPrefix: string
  }
  bccProps: {
    id: string
    label: string
    emails: string[]
    setEmails: (emails: string[]) => void
    required: boolean
    hiddenPrefix: string
  }
  subjectProps: {
    subject: string
    setSubject: (subject: string) => void
  }
  messageProps: {
    content: string
    onChange: (content: string) => void
  }
}

export function useEmailForm({ onSuccess, onError }: UseEmailFormProps = {}): UseEmailFormReturn {
  const [to, setTo] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [selectedSender, setSelectedSender] = useState<string>("")
  const [emailList, setEmailList] = useState<from[]>([])

  const [state, action, isPending] = useActionState(sendGeneralEmailAction, { status: "idle" as const })

  // Fetch email list on mount
  const fetchEmailList = useCallback(async () => {
    try {
      const list = await getEmailList()
      setEmailList(list)
    } catch {
      toast.error("Unable to fetch senders")
    }
  }, [])

  // Initialize on mount
  useState(() => {
    fetchEmailList()
  })

  // Handle success/error states
  useState(() => {
    if (state.status === "success") {
      toast.success(state.message || "Email sent!")
      onSuccess?.()
    }
    if (state.status === "error") {
      toast.error(state.message || "Failed to send")
      onError?.()
    }
  })

  return {
    to,
    setTo,
    bcc,
    setBcc,
    subject,
    setSubject,
    message,
    setMessage,
    selectedSender,
    setSelectedSender,
    emailList,
    state,
    action,
    isPending,
    senderProps: {
      emailList,
      value: selectedSender,
      onChange: setSelectedSender,
    },
    toProps: {
      id: "to",
      label: "To",
      emails: to,
      setEmails: setTo,
      required: true,
      hiddenPrefix: "tos",
    },
    bccProps: {
      id: "bcc",
      label: "BCC",
      emails: bcc,
      setEmails: setBcc,
      required: false,
      hiddenPrefix: "bccs",
    },
    subjectProps: {
      subject,
      setSubject,
    },
    messageProps: {
      content: message,
      onChange: setMessage,
    },
  }
}
