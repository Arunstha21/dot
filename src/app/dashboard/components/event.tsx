"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Grouping, IDPass } from "./message"
import { type GroupAndSchedule, type Schedule, getEventData, getGroupAndSchedule } from "@/server/database"
import ScheduleData from "@/components/scheduleData"
import { toast } from "sonner"
import { getEmailList, type from } from "@/server/sendgrid"
import SenderSelect from "./email/sender-select"
import RecipientsField from "./email/recipients-field"
import SubjectField from "./email/subject-field"
import MessagePreview from "./email/message-preview"
import EventSelectors from "./event-email/event-selectors"
import IdPassFields from "./event-email/id-pass-fields"
import { formatDateHuman, formatTimeHuman, interpolateTemplate, sanitizeEditableHtml } from "@/lib/email/utils"
import { useActionState } from "react"
import { sendEventEmailAction } from "@/server/actions/email-actions"

const subjectTemplate = {
  idPass: "Lobby Credentials for ${event} - ${stage} - ${group} - Match ${matchNo}",
  groupings: "Groupings and Timings for ${event} - ${stage} - ${group}",
}

export type Event = { id: string; name: string }
export type Stage = { id: string; name: string }

export type EventDataE = {
  id: string
  name: string
  discordLink?: string
  organizer?: string
  stages: Stage[]
}

export default function Event() {
  const [to, setTo] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [emailList, setEmailList] = useState<from[]>([])
  const [selectedSender, setSelectedSender] = useState<string>("")
  const [shake, setShake] = useState(false)
  const [messageType, setMessageType] = useState<"ID Pass" | "Groupings">("ID Pass")
  const [messageData, setMessageData] = useState<IDPass | Grouping | null>(null)

  // Event selection state
  const [event, setEvent] = useState<string>("")
  const [stage, setStage] = useState<string>("")
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined)
  const [map, setMap] = useState<string>("")
  const [matchId, setMatchId] = useState<number | undefined>(undefined)
  const [password, setPassword] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [group, setGroup] = useState<string>("")
  const [groupings, setGroupings] = useState<{ slot: string; team: string }[]>([])
  const [matches, setMatches] = useState<Schedule[]>([])

  const [eventData, setEventData] = useState<any[]>([])
  const [eventList, setEventList] = useState<Event[]>([])
  const [stageList, setStageList] = useState<Stage[]>([])
  const [groupList, setGroupList] = useState<GroupAndSchedule[]>([])
  const [scheduleList, setScheduleList] = useState<Schedule[]>([])
  const [isMultiGroup, setIsMultiGroup] = useState<boolean>(false)

  const previewRef = useRef<HTMLDivElement>(null)
  const [state, action, isPending] = useActionState(sendEventEmailAction, { status: "idle" as const })

  function shakeForm() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  useEffect(() => {
    async function init() {
      try {
        const list = await getEmailList()
        setEmailList(list)
        const events = await getEventData()
        if (!events.length) return
        setEventData(events)
        setEventList(events.map((e: any) => ({ id: e.id, name: e.name })))
      } catch (e) {
        console.log('Error : ', e);
        toast.error("Failed to load initial data")
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (event) {
      const stages = eventData.find((e) => e.id === event)?.stages || []
      setStageList(stages)
    }
  }, [event, eventData])

  useEffect(() => {
    async function fetchGroupData() {
      if (!stage) return
      const groupAndScheduleData = await getGroupAndSchedule(stage)
      const { groups, isMultiGroup } = groupAndScheduleData
      setGroupList(groups)
      setIsMultiGroup(isMultiGroup)
    }
    fetchGroupData()
  }, [stage])

  useEffect(() => {
    if (!matchNo) return
    const match = scheduleList.find((s) => s.id === matchNo)
    if (match) {
      setStartTime(formatTimeHuman(match.startTime) || "")
      setDate(formatDateHuman(match.date) || "")
      setMap(match.map || "")
    }
  }, [matchNo, scheduleList])

  useEffect(() => {
    if (!eventData || !eventList || !stageList || !groupList || !scheduleList) return
    const eventDetails = {
      event: eventList.find((e) => e.id === event)?.name,
      discordLink: eventData.find((e) => e.id === event)?.discordLink,
      organizer: eventData.find((e) => e.id === event)?.organizer,
      stage: stageList.find((s) => s.id === stage)?.name,
      matchNo: scheduleList.find((s) => s.id === matchNo)?.matchNo,
      groupName: groupList.find((g) => g.id === group)?.name,
    }

    if (messageType === "ID Pass") {
      setSubject(
        interpolateTemplate(subjectTemplate.idPass, {
          event: eventDetails.event,
          stage: eventDetails.stage,
          group: eventDetails.groupName,
          matchNo: eventDetails.matchNo,
        }),
      )
      setMessageData({
        event: eventDetails.event,
        discordLink: eventDetails.discordLink,
        organizer: eventDetails.organizer,
        stage: eventDetails.stage,
        matchNo: eventDetails.matchNo,
        map,
        matchId: matchId || 0,
        password,
        startTime,
        date,
        group,
        groupName: eventDetails.groupName,
        groupings,
      } as IDPass)
    } else {
      setSubject(
        interpolateTemplate(subjectTemplate.groupings, {
          event: eventDetails.event,
          stage: eventDetails.stage,
          group: eventDetails.groupName,
        }),
      )
      setMessageData({
        event: eventDetails.event,
        discordLink: eventDetails.discordLink,
        organizer: eventDetails.organizer,
        stage: eventDetails.stage,
        group,
        groupName: eventDetails.groupName,
        matches,
        groupings,
      } as Grouping)
    }
  }, [
    messageType,
    event,
    stage,
    matchNo,
    map,
    matchId,
    password,
    startTime,
    date,
    group,
    groupings,
    matches,
    eventData,
    eventList,
    stageList,
    groupList,
    scheduleList,
  ])

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId)
    const scheduleData = groupList.find((g) => g.id === groupId)?.schedule || []
    const mapped = scheduleData.map((s) => ({
      id: s.id,
      matchNo: s.matchNo,
      map: s.map,
      date: s.date,
      startTime: s.startTime,
    }))
    setMatches(mapped)
    setScheduleList(scheduleData)

    const selectedGroupEmails = groupList.find((g) => g.id === groupId)?.data.map((d) => d.email) || []
    const decodedGroupings =
      groupList.find((g) => g.id === groupId)?.data.map((d) => ({ slot: String(d.slot), team: d.team })) || []

    setGroupings(decodedGroupings)
    setBcc(selectedGroupEmails.filter((email): email is string => typeof email === "string"))
  }

  useEffect(() => {
    if (state.status === "success") toast.success(state.message || "Email sent!")
    if (state.status === "error") {
      shakeForm()
      toast.error(state.message || "Failed to send")
    }
  }, [state.status, state.message])

  return (
    <div className="container mx-auto py-8">
      <Card className={`w-full max-w-6xl mx-auto ${shake ? "animate-shake" : ""}`}>
        <CardHeader>
          <CardTitle>Send Event Email</CardTitle>
          <CardDescription>Compose and send emails for esports events</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SenderSelect emailList={emailList} value={selectedSender} onChange={setSelectedSender} />
              <RecipientsField id="to" label="To" emails={to} setEmails={setTo} hiddenPrefix="tos" />
              <RecipientsField id="bcc" label="BCC" emails={bcc} setEmails={setBcc} hiddenPrefix="bccs" />
              <SubjectField subject={subject} setSubject={setSubject} />

              <div className="grid w-full gap-1.5">
                <label className="text-sm font-medium">Message Type</label>
                <select
                  className="border rounded-md h-10 px-3"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as any)}
                >
                  <option value="ID Pass">ID Pass</option>
                  <option value="Groupings">Groupings</option>
                </select>
              </div>

              <EventSelectors
                event={event}
                setEvent={setEvent}
                stage={stage}
                setStage={setStage}
                group={group}
                onGroupChange={handleGroupChange}
                events={eventList}
                stages={stageList}
                groups={groupList}
              />

              {messageType === "ID Pass" && (
                <IdPassFields
                  matchNo={matchNo}
                  setMatchNo={setMatchNo}
                  matchId={matchId}
                  setMatchId={setMatchId}
                  password={password}
                  setPassword={setPassword}
                  scheduleList={scheduleList}
                />
              )}

              {messageType === "Groupings" && (
                <ScheduleData matches={matches} setMatches={setMatches} isEditing={true} />
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>

            <div>
              <MessagePreview
                ref={previewRef}
                html={messageData ? renderMessageHtml(messageType, messageData) : ""}
                label="Message Preview"
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function escape(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function renderMessageHtml(type: "ID Pass" | "Groupings", data: IDPass | Grouping) {
  if (type === "ID Pass") {
    const d = data as IDPass
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div contenteditable="true" suppresscontenteditablewarning="true">
          <p>Hi Team,</p>
          <p>${escape(d.event)} of ${escape(d.stage)}</p>
          <p>Match ${escape(d.matchNo)} for your group is scheduled for ${escape(d.date)} at ${escape(d.startTime)}.</p>
          <p>Please be on time and don't forget to stay in your specific slot.</p>
          <p>Please find the match credentials below:</p>
        </div>
        <h3>Match Credentials</h3>
        <table style="border-collapse: collapse; width: 80%; max-width: 400px; margin: 0 auto; font-size: 14px;">
          <tbody>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Map</td><td style="border:1px solid; text-align:center;">${escape(d.map)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Match ID</td><td style="border:1px solid; text-align:center;">${escape(d.matchId)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Password</td><td style="border:1px solid; text-align:center;">${escape(d.password)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Start Time</td><td style="border:1px solid; text-align:center;" contenteditable="true" suppresscontenteditablewarning="true">${escape(d.startTime)}</td></tr>
            <tr><td style="border:1px solid; text-align:center; font-weight:bold;">Date</td><td style="border:1px solid; text-align:center;">${escape(d.date)}</td></tr>
          </tbody>
        </table>
        <h3>Groupings of ${escape(d.groupName)} :-</h3>
        <table style="border-collapse: collapse; width: 80%; max-width: 400px; margin: 0 auto; font-size: 14px;">
          <thead>
            <tr>
              <th style="border:1px solid; text-align:center; font-weight:bold;">Slot</th>
              <th style="border:1px solid; text-align:center; font-weight:bold;">Team Name</th>
            </tr>
          </thead>
          <tbody>
            ${d.groupings
              .map(
                (g) =>
                  `<tr><td style="border:1px solid; text-align:center;">${escape(g.slot)}</td><td style="border:1px solid; text-align:center;">${escape(g.team)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <div contenteditable="true" suppresscontenteditablewarning="true">
          <p>Join our discord server if you need any help or have any queries.</p>
          <p>Link: ${escape(d.discordLink)}</p>
          <br />
          <p>Good luck!</p>
          <p>Yours truly,<br/>${escape(d.organizer)}</p>
        </div>
      </div>
    `
    return sanitizeEditableHtml(html)
  }

  const d = data as Grouping
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div contenteditable="true" suppresscontenteditablewarning="true">
        <p>Hi Team,</p>
        <p>Reminder! for ${escape(d.event)} of ${escape(d.stage)}. Here are the details for your matches.</p>
        <h3>Matches :-</h3>
      </div>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 0 auto; font-size: 14px;">
        <thead>
          <tr>
            <th style="border:1px solid; text-align:center; font-weight:bold;">S.N</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Map</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Date</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Time</th>
          </tr>
        </thead>
        <tbody>
          ${(d.matches || [])
            .map(
              (m, i) =>
                `<tr><td style="border:1px solid; text-align:center;">${i + 1}</td><td style="border:1px solid; text-align:center;">${escape(m.map)}</td><td style="border:1px solid; text-align:center;">${escape(m.date)}</td><td style="border:1px solid; text-align:center;">${escape(m.startTime)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <div contenteditable="true" suppresscontenteditablewarning="true">
        <p>Join our discord server to view the schedule and more!</p>
        <p>Link: ${escape(d.discordLink)}</p>
      </div>
      <h3>Groupings of ${escape(d.groupName)} :-</h3>
      <table style="border-collapse: collapse; width: 80%; max-width: 400px; margin: 0 auto; font-size: 14px;">
        <thead>
          <tr>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Slot</th>
            <th style="border:1px solid; text-align:center; font-weight:bold;">Team Name</th>
          </tr>
        </thead>
        <tbody>
          ${d.groupings
            .map(
              (g) =>
                `<tr><td style="border:1px solid; text-align:center;">${escape(g.slot)}</td><td style="border:1px solid; text-align:center;">${escape(g.team)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <div contenteditable="true" suppresscontenteditablewarning="true">
        <p>Top 6 teams from each group will qualify for the next round.</p>
        <p>Need help, or have questions? Join our discord server and ask for help in the #queries channel.</p>
        <br />
        <p>Yours truly,<br />${escape(d.organizer)}</p>
      </div>
    </div>
  `
  return sanitizeEditableHtml(html)
}
