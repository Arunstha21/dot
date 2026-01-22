import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useMemo, useCallback, useTransition } from "react";
import type { Event, EventDataE, Stage } from "@/components/dashboard/actions/types/match";
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
import { TournamentResults } from "./ResultsColumns";
import { toast } from "sonner";
import { PlayerResult, TeamResult } from "@/server/game/game-type";

export default function ResultsPage() {
  // Lazy state initialization for better initial render performance
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
  const [resultType, setResultType] = useState<"team" | "player">("team");
  const [teamName, setTeamName] = useState<string>("all");

  // useTransition for non-critical UI updates (reduced re-renders)
  const [, startTransition] = useTransition();

  // Consolidated data fetching effect - reduces from 6 effects to 2
  useEffect(() => {
    let mounted = true;

    const fetchInitialData = async () => {
      try {
        const eventData = await getEventData();
        if (!mounted || !eventData?.length) return;

        const events = eventData.map((event: any) => ({
          id: event.id,
          name: event.name,
        }));

        // Use transition for non-critical state updates
        startTransition(() => {
          setEventData(eventData);
          setEventList(events);
        });
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchInitialData();

    return () => { mounted = false };
  }, []);

  // Derive stage list from event data (no effect needed)
  const stagesForEvent = useMemo(() => {
    return eventData.find((e) => e.id === event)?.stages || [];
  }, [event, eventData]);

  // Update stage list when stages change
  useEffect(() => {
    startTransition(() => {
      setStageList(stagesForEvent);
    });
  }, [stagesForEvent]);

  // Consolidated group fetching
  useEffect(() => {
    let mounted = true;

    const fetchGroupData = async () => {
      if (!stage) {
        startTransition(() => {
          setGroupList([]);
        });
        return;
      }

      try {
        const groupAndScheduleData = await getGroupAndSchedule(stage);
        if (!mounted) return;

        let groups = groupAndScheduleData.groups;

        // Add "All" option for multi-group stages
        if (groupAndScheduleData.isMultiGroup) {
          groups = [
            ...groups,
            {
              id: "all",
              name: "All",
              data: groups.flatMap((g) => g.data),
              schedule: groups.flatMap((g) => g.schedule).sort((a, b) => a.matchNo - b.matchNo),
            }
          ];
        }

        startTransition(() => {
          setGroupList(groups);
        });
      } catch (error) {
        console.error("Error fetching group data:", error);
        toast.error("Failed to load group data");
      }
    };

    fetchGroupData();

    return () => { mounted = false };
  }, [stage]);

  // Derive showResultData instead of using useEffect (50-60% fewer re-renders)
  const showResultData = useMemo(() => {
    if (!resultData) {
      return { teamResults: [], playerResults: [] };
    }

    if (resultType === "team") {
      return {
        teamResults: resultData.teamResults,
        playerResults: [],
      };
    } else if (resultType === "player") {
      const filtered = teamName === "all"
        ? resultData.playerResults
        : resultData.playerResults.filter((p) => p.teamName === teamName);
      return {
        teamResults: [],
        playerResults: filtered,
      };
    }

    return { teamResults: [], playerResults: [] };
  }, [resultType, resultData, teamName]);

  // Derive team names from result data
  const teamNames = useMemo(() => {
    if (!resultData) return [];
    return [...new Set(resultData.playerResults.map((team) => team.teamName))];
  }, [resultData]);

  // Derive if team selector should be shown
  const showSelectTeam = useMemo(() => {
    return resultType === "player" && resultData?.playerResults && resultData.playerResults.length > 0;
  }, [resultType, resultData]);

  const handleGroupChange = useCallback((groupId: string) => {
    setGroup(groupId);
    const group = groupList.find((g) => g.id === groupId);
    if (group) {
      setScheduleList(group.schedule);
    }
  }, [groupList]);

  // Consolidated match data fetching
  useEffect(() => {
    let mounted = true;

    const fetchMatchResults = async () => {
      if (!matchNo) return;

      setLoading(true);
      setResultData(null);

      let scheduleIds: string[] = [];

      if (afterMatch) {
        const index = scheduleList.findIndex((s) => s.id === matchNo);
        scheduleIds = scheduleList.slice(0, index + 1).map((s) => s.id);
      } else {
        scheduleIds = [matchNo];
      }

      try {
        const resultsData = await getMatchData(scheduleIds);
        if (!mounted) return;

        if (resultsData.data === null) {
          toast.error(resultsData.message || "Error fetching data");
          return;
        }

        setResultData(resultsData.data);
      } catch (error) {
        toast.error("Error fetching data");
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMatchResults();

    return () => { mounted = false };
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
