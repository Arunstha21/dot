"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SenderSelect, RecipientsField, SubjectField, RichTextEditor } from "@/components/dashboard/actions/shared/email";
import dynamic from 'next/dynamic';
import { useActionState } from "react";
import { sendGeneralEmailAction } from "@/server/actions/email-actions";
import { useEmailConfiguration } from "@/contexts/EmailConfigurationContext";

// Dynamic import for TipTap editor - loaded only when needed (~200KB savings)
const RichEditor = dynamic(() => import("@/components/dashboard/actions/shared/email/RichTextEditor").then(m => ({ default: m.default })), {
  loading: () => <div className="h-[200px] w-full bg-muted animate-pulse rounded-md" />,
  ssr: false
});

export function ComposeNewForm() {
  const [to, setTo] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { config, setSelectedSender } = useEmailConfiguration();

  const [state, action, isPending] = useActionState(sendGeneralEmailAction, { status: "idle" as const });

  useEffect(() => {
    if (state.status === "success") toast.success(state.message || "Email sent!")
    if (state.status === "error") {
      toast.error(state.message || "Failed to send")
    }
  }, [state.status, state.message])

  return (
    <form action={action} className="space-y-4 flex-grow flex flex-col">
      <SenderSelect emailList={config.senders} value={config.selectedSender} onChange={setSelectedSender} />
      <RecipientsField id="to" label="To" emails={to} setEmails={setTo} required hiddenPrefix="tos" />
      <RecipientsField id="bcc" label="BCC" emails={bcc} setEmails={setBcc} hiddenPrefix="bccs" />
      <SubjectField subject={subject} setSubject={setSubject} />
      <div className="grid w-full items-center gap-1.5 flex-grow">
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <div className="flex-grow">
          <RichEditor content={message} onChange={setMessage} />
        </div>
        <input type="hidden" name="message" value={message} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>{isPending ? "Sending..." : "Send Email"}</Button>
      </div>
    </form>
  )
}
