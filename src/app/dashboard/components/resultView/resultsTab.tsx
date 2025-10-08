import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Event, EventDataE, Stage } from "../event";
import {
  GroupAndSchedule,
  Schedule,
  getEventData,
  getGroupAndSchedule,
} from "@/server/database";
import {
  getMatchData,
} from "@/server/game/match";
import { Checkbox } from "@/components/ui/checkbox";
import { TournamentResults } from "./columns";
import { toast } from "sonner";
import { PlayerResult, TeamResult } from "@/server/game/game-type";

export default function ResultTabs() {
  const [event, setEvent] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [matchNo, setMatchNo] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState<boolean>(false);

  const [eventData, setEventData] = useState<EventDataE[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [stageList, setStageList] = useState<Stage[]>([]);
  const [groupList, setGroupList] = useState<GroupAndSchedule[]>([]);
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [resultData, setResultData] = useState<{
    teamResults: TeamResult[];
    playerResults: PlayerResult[];
  } | null>(null);
  const [afterMatch, setAfterMatch] = useState<boolean>(false);
  const [showResultData, setShowResultData] = useState<{
    teamResults: TeamResult[];
    playerResults: PlayerResult[];
  }>({ teamResults: [], playerResults: [] });
  const [resultType, setResultType] = useState<"team" | "player">("team");
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [teamName, setTeamName] = useState<string>("all");
  const [showSelectTeam, setShowSelectTeam] = useState<boolean>(false);

  useEffect(() => {
    async function fetchEventList() {
      const eventData = await getEventData();
      if (!eventData || !eventData.length) {
        return;
      }
      setEventData(eventData);

      const events = eventData.map((event: any) => ({
        id: event.id,
        name: event.name,
      }));
      setEventList(events);
    }
    fetchEventList();
  }, []);

  useEffect(() => {
    const stages = eventData.find((e) => e.id === event)?.stages || [];
    setStageList(stages);
  }, [event, eventData]);

  useEffect(() => {
    if (resultData) {
      if (resultType === "team") {
        setShowSelectTeam(false);
        setShowResultData({
          teamResults: resultData.teamResults,
          playerResults: [],
        });
      } else if (resultType === "player") {
        setShowSelectTeam(true);
        setTeamNames([...new Set(resultData.playerResults.map((team) => team.teamName))]);
        setShowResultData({
          teamResults: [],
          playerResults: resultData.playerResults,
        });
      } else {
        setShowSelectTeam(false);
        setShowResultData({ teamResults: [], playerResults: [] });
      }
    }
  }, [resultType, resultData]);

  useEffect(() => {
    if(showSelectTeam){
    if (teamName === "all") {
      setShowResultData({
        teamResults: [],
        playerResults: resultData?.playerResults || [],
      });
    } else {
      setShowResultData({
        teamResults: [],
        playerResults: resultData?.playerResults.filter((p) => p.teamName === teamName) || [],
      });
    }
  }
  }, [teamName, resultData]);

  useEffect(() => {
    async function fetchGroupData() {
      if (stage === "") {
        return;
      }
      const groupAndScheduleData = await getGroupAndSchedule(stage);
      const { groups, isMultiGroup } = groupAndScheduleData;
      if (isMultiGroup) {
       groups.push({
          id: "all",
          name: "All",
          data: groups.flatMap((g) => g.data),
          schedule: groups.flatMap((g) => g.schedule).sort((a,b)=> a.matchNo - b.matchNo),
       })
        setGroupList(groups);
      }else{
        setGroupList(groups);
      }
    }
    fetchGroupData();
  }, [stage]);

  const handleGroupChange = async (groupId: string) => {
    setGroup(groupId);
    const group = groupList.find((g) => g.id === groupId);
    if (!group) {
      return;
    }
    setScheduleList(group.schedule);
  };

  useEffect(() => {
    const fetchData = async (matchNo: string) => {
      setLoading(true);
      setResultData(null);
      setShowResultData({ teamResults: [], playerResults: [] });
  
      let scheduleIds: string[] = [];
  
      if (afterMatch) {
        const index = scheduleList.findIndex((s) => s.id === matchNo);
        scheduleIds = scheduleList.slice(0, index + 1).map((s) => s.id);
      } else {
        scheduleIds = [matchNo];
      }
  
      try {
        const resultsData = await getMatchData(scheduleIds);
        if (resultsData.data === null) {
          toast.error(resultsData.message || "Error fetching data");
          return;
        }
  
        setResultData(resultsData.data);
        setShowSelectTeam(false);
        setShowResultData({
          teamResults: resultsData.data.teamResults,
          playerResults: [],
        });
      } catch (error) {
        toast.error("Error fetching data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    if (matchNo) {
      fetchData(matchNo);
    }
  }, [afterMatch, matchNo, scheduleList]);
  

  return (
    <div className="w-full py-8 max-w-6xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="event">Event</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger id="event">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              {eventList.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger id="stage">
              <SelectValue placeholder="Select Stage" />
            </SelectTrigger>
            <SelectContent>
              {stageList.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="group">Group</Label>
          <Select value={group} onValueChange={handleGroupChange}>
            <SelectTrigger id="group">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {groupList.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="matchNo">Match Number</Label>
          <Select value={matchNo} onValueChange={setMatchNo}>
            <SelectTrigger id="matchNo">
              <SelectValue placeholder="Select Match" />
            </SelectTrigger>
            <SelectContent>
              {scheduleList.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {`${afterMatch ? "After Match" : "Match"} ${
                    schedule.matchNo
                  }`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex mt-6 items-center space-x-2">
          <Checkbox
            checked={afterMatch}
            onCheckedChange={(c) => setAfterMatch(Boolean(c))}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            After Match
          </label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Result Type</Label>
          <Select
            value={resultType}
            onValueChange={(v) => setResultType(v as "team" | "player")}
          >
            <SelectTrigger id="resultType">
              <SelectValue placeholder="Select Result Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={"team"} value={"team"}>
                Team Stats
              </SelectItem>
              <SelectItem key={"player"} value={"player"}>
                Player Stats
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {showSelectTeam && (
          <div className="space-y-2">
          <Label htmlFor="type">Team Name</Label>
          <Select
            value={teamName}
            onValueChange={setTeamName}
          >
            <SelectTrigger id="teamName">
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={"all"} value={"all"}>
                All
              </SelectItem>
              {teamNames.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        )}
      </div>
      <div className="w-full flex items-center">
           <TournamentResults data={showResultData} isLoading={loading} sendResultData={{stageId: stage, matchTitle: `${afterMatch ? "After Match" : "Match"} ${scheduleList.filter((f) => f.id === matchNo).map((f) => f.matchNo)}`}}/>
      </div>
    </div>
  );
}
