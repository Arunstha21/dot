"use server";

import { getDiscordToken } from "@/server/actions/discord-actions";
import { createTableImage, TableConfig, TableData } from "./create";
import { logger } from "@/discord/logger";

// Discord REST API types
interface DiscordGuild {
	id: string;
	name: string;
}

interface DiscordChannel {
	id: string;
	name: string;
	type: number;
}

const DISCORD_API_BASE = "https://discord.com/api/v10";

async function discordFetch(endpoint: string, options: RequestInit = {}) {
    const token = await getDiscordToken();
    if (!token || token === "") {
        throw new Error("Discord bot token not configured.");
    }
  const res = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(
      `Discord API error ${res.status}: ${await res.text()}`
    );
  }

  return res;
}

export async function sendDiscordResults(
  guildId: string,
  channelId: string,
  data: TableData,
  messageContent: string,
  title?: string,
  tableConfig?: TableConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Validate bot is in guild
    const guildRes = await discordFetch(`/users/@me/guilds`);
    const guilds = await guildRes.json() as DiscordGuild[];
    if (!guilds.find((g) => g.id === guildId)) {
      return { success: false, error: "Guild not found or bot not in server." };
    }

    // 2. Validate channel
    const channelRes = await discordFetch(`/channels/${channelId}`);
    const channel = await channelRes.json() as DiscordChannel;
    if (!channel || !["0", "2"].includes(String(channel.type))) {
      // type 0 = text channel, 2 = voice channel (but not suitable for send)
      return { success: false, error: "Channel not found or not text-based." };
    }

    // 3. Create image
    const imageBuffer = await createTableImage(data, title, tableConfig);

    // 4. Send message with multipart/form-data
    const form = new FormData();
    form.append("content", messageContent);
    form.append(
      "files[0]",
      new Blob([Uint8Array.from(imageBuffer)], { type: "image/png" }),
      "results.png"
    );

    await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: form as unknown as RequestInit['body'],
    });

    return { success: true };
  } catch (error) {
    logger.error("Error sending Discord results:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkBotInServer(guildId: string): Promise<boolean> {
  try {
    const guildRes = await discordFetch(`/users/@me/guilds`);
    const guilds = await guildRes.json() as DiscordGuild[];
    return guilds.some((g) => g.id === guildId);
  } catch (error) {
    logger.error("Error checking bot presence:", error);
    return false;
  }
}

export async function getDiscordChannels(
  guildId: string
): Promise<Array<{ id: string; name: string; type: number }>> {
  try {
    const res = await discordFetch(`/guilds/${guildId}/channels`);
    const channels = await res.json() as DiscordChannel[];

    return channels
      .filter((c) => c.type === 0) // type 0 = text
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }));
  } catch (error) {
    logger.error("Error fetching Discord channels:", error);
    return [];
  }
}
