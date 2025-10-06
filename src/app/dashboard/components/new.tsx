"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getEmailList, type from } from "@/server/sendgrid";
import { toast } from "sonner";
import SenderSelect from "./email/sender-select";
import RecipientsField from "./email/recipients-field";
import SubjectField from "./email/subject-field";
import RichTextEditor from "./RichEditor";
import { useActionState } from "react";
import { sendGeneralEmailAction } from "@/server/actions/email-actions";

export default function New() {
  const [to, setTo] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emailList, setEmailList] = useState<from[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>("");
  const [shake, setShake] = useState(false);

  const [state, action, isPending] = useActionState(sendGeneralEmailAction, { status: "idle" as const });

  function shakeForm() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const list = await getEmailList();
        setEmailList(list);
      } catch {
        toast.error("Unable to fetch senders")
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message || "Email sent!")
    if (state.status === "error") {
      shakeForm()
      toast.error(state.message || "Failed to send")
    }
  }, [state.status, state.message])

  return (
    <div className="container mx-auto py-8">
      <Card className={`w-full max-w-6xl mx-auto ${shake ? 'animate-shake' : ''}`}>
        <CardHeader className="flex items-center justify-between">
          Compose New Email
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <form action={action} className="space-y-4 flex-grow flex flex-col">
            <SenderSelect emailList={emailList} value={selectedSender} onChange={setSelectedSender} />
            <RecipientsField id="to" label="To" emails={to} setEmails={setTo} required hiddenPrefix="tos" />
            <RecipientsField id="bcc" label="BCC" emails={bcc} setEmails={setBcc} hiddenPrefix="bccs" />
            <SubjectField subject={subject} setSubject={setSubject} />
            <div className="grid w-full items-center gap-1.5 flex-grow">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <div className="flex-grow">
                <RichTextEditor content={message} onChange={setMessage} />
              </div>
              <input type="hidden" name="message" value={message} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>{isPending ? "Sending..." : "Send Email"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    
  );
}
