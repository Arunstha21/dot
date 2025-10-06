"use server";

import { Guild, IGuild } from "@/lib/database/guild";
import { Stage, IStage } from "@/lib/database/schema";
import mongoose from "mongoose";

// --- Universal serializer for Mongo/Mongoose objects ---
function serialize<T>(doc: any): T {
  if (!doc) return doc;

  return JSON.parse(
    JSON.stringify(doc, (_, value) => {
      if (value instanceof mongoose.Types.ObjectId) {
        return value.toString();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }),
  );
}

// --- Get Stage with Guild populated ---
export async function getStageWithGuild(
  stageId: string,
): Promise<{ stage: IStage; guild?: IGuild } | null> {
  try {
    const stage = await Stage.findById(stageId).populate("guild").lean();

    if (!stage) return null;

    const stringified = serialize<any>(stage);

    return {
      stage: stringified as IStage,
      guild: stringified.guild as IGuild,
    };
  } catch (error) {
    console.error("Error fetching stage:", error);
    return null;
  }
}

// --- Update Guild result channel ---
export async function updateGuildResultChannel(
  guildId: string,
  channelId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await Guild.findByIdAndUpdate(guildId, { resultChannel: channelId });
    return { success: true };
  } catch (error) {
    console.error("Error updating guild:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// --- Get Guild by ID ---
export async function getGuildById(guildId: string): Promise<IGuild | null> {
  try {
    const guild = await Guild.findById(guildId).lean();
    return serialize<IGuild>(guild);
  } catch (error) {
    console.error("Error fetching guild:", error);
    return null;
  }
}


export async function linkGuildToStage(
  stageId: string,
  guildId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await Stage.findByIdAndUpdate(stageId, { guild: guildId })

    return { success: true }
  } catch (error) {
    console.error("Error linking guild to stage:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

