import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOG_PATH = path.resolve(process.cwd(), 'discord.log');

function parseLogLine(line: string) {
    // Example: 13:49:33 31/07/2025 - info: Discord client started successfully.
    const match = line.match(/^(\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}) - (\w+): (.+)$/);
    if (!match) return null;
    return {
        timestamp: match[1],
        level: match[2],
        message: match[3],
    };
}

export async function GET() {
    try {
        const data = await fs.readFile(LOG_PATH, 'utf8');
        const logs = data
            .split('\n')
            .map(line => parseLogLine(line))
            .filter(Boolean);

        return NextResponse.json({ logs });
    } catch (err) {
        console.error("Error reading log file:", err);
        return NextResponse.json({ error: 'Could not read log file.' }, { status: 500 });
    }
}