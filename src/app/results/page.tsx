import { getEventData } from "@/server/publicResult";
import EventList from "./components/event-list";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const eventsData = await getEventData();
    
  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">DOT (PUBGM)</h1>
      </header>
      <div>
          <EventList eventsData={eventsData}/>
      </div>
    </div>
  )
}
