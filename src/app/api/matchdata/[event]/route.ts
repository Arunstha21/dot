import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ event: string }> }) {
    try {
        const filePath = path.join(process.cwd(), 'localStore.json');
        const { event } = await params;
        
        const data = await fs.readFile(filePath, 'utf-8');

        interface MatchDataItem {
            event: string;
            data: any;
            timestamp: string;
        }

        const jsonData: MatchDataItem[] = JSON.parse(data);
        const existingItem: MatchDataItem | undefined = jsonData.find((item: MatchDataItem) => item.event === event);

        if (!existingItem) {
          return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
        }

        const { data: matchData } = existingItem;
        return new Response(JSON.stringify(matchData), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Could not read data' }), { status: 500 });
    }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ event: string }> }
) {
  const { event } = await params;
  const data = await request.json();

  if (!event || !data) {
    return new Response(
      JSON.stringify({ error: "Invalid payload" }),
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "localStore.json");

  let existingData: { event: string; data: any; timestamp: string }[] = [];
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    existingData = JSON.parse(fileContent);
    if (!Array.isArray(existingData)) existingData = [];
  } catch {
    existingData = [];
  }

  const index = existingData.findIndex((item) => item.event === event);

  if (index !== -1) {
    existingData[index].data = data;
    existingData[index].timestamp = new Date().toISOString();
  } else {
    existingData.push({
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  }
  console.log(`Updated data for event: ${event}`);
  
  await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), "utf-8");

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
