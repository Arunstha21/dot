"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { IDPass, Grouping } from "@/components/dashboard/actions/types/email"
import { type GroupAndSchedule, type Schedule, getGroupAndSchedule } from "@/server/database"
import ScheduleData from "@/components/scheduleData"
import { toast } from "sonner"
import { SenderSelect, RecipientsField, SubjectField, MessagePreview } from "@/components/dashboard/actions/shared/email"
import { EventSelectors, type Event, type Stage } from "@/components/dashboard/actions/shared/selectors"
import IdPassFields from "./IdPassFields"
import { formatDateHuman, formatTimeHuman, interpolateTemplate } from "@/lib/email/utils"
import { useActionState } from "react"
import { sendEventEmailAction } from "@/server/actions/email-actions"
import { renderMessageHtml } from "./renderMessageHtml"
import { useEmailConfiguration } from "@/contexts/EmailConfigurationContext"
import { useEventData } from "@/contexts/EventDataContext"

const subjectTemplate = {
  idPass: "Lobby Credentials for ${event} - ${stage} - ${group} - Match ${matchNo}",
  groupings: "Groupings and Timings for ${event} - ${stage} - ${group}",
}

type EventDataE = {
  id: string
  name: string
  discordLink?: string
  organizer?: string
  stages: Stage[]
}

export function ComposeEventForm() {
  const [to, setTo] = useState<string[]>([])
  const [bcc, setBcc] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const { config, setSelectedSender } = useEmailConfiguration()
  const { eventData, eventList } = useEventData()
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
    /* eslint-disable react-hooks/set-state-in-effect */
    if (event) {
      const stages = eventData.find((e) => e.id === event)?.stages || []
      setStageList(stages)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
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
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!matchNo) return
    const match = scheduleList.find((s) => s.id === matchNo)
    if (match) {
      setStartTime(formatTimeHuman(match.startTime) || "")
      setDate(formatDateHuman(match.date) || "")
      setMap(match.map || "")
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [matchNo, scheduleList])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
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
        isMultiGroup,
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
        isMultiGroup,
      } as Grouping)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
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
    isMultiGroup,
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
    /* eslint-disable react-hooks/set-state-in-effect */
    if (state.status === "success") toast.success(state.message || "Email sent!")
    if (state.status === "error") {
      shakeForm()
      toast.error(state.message || "Failed to send")
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [state.status, state.message])

  return (
    <form action={action} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <SenderSelect emailList={config.senders} value={config.selectedSender} onChange={setSelectedSender} />
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
  )
}
