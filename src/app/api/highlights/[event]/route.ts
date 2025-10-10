import { getTournamentHighlights } from "@/server/match";

export async function GET(request: Request, { params }: { params: Promise<{ event: string }> }) {
    try {
        const { event } = await params;
        const highlights = await getTournamentHighlights(event);
        
        return new Response(JSON.stringify(highlights), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Could not retrieve highlights data' }), { status: 500 });
    }
}
