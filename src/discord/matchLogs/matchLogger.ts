import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { logger } from "../logger";
import mongoose from "mongoose";
import { MatchLog, MatchLogger } from "@/lib/database/matchLog";

export async function matchLogger(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    await interaction.deferReply();

    const matchId = interaction.options.getString("match_id");
    const region = interaction.options.getString("region");
    const logType = interaction.options.getString("log_type");
    const noOfPlayers = interaction.options.getInteger("no_of_players");
    const time = interaction.options.getString("time");
    const log = interaction.options.getString("log");

    const guildId = interaction.guild?.id;
    if (!guildId) {
      await interaction.editReply("This command can only be used in a server.");
      return;
    }

    const timeStamp = time ? new Date(time) : new Date();

    const existingLogger = await MatchLogger.findOne({ guildId });
    if (!existingLogger || !existingLogger.active) {
      await interaction.editReply("No active logger found for this guild. Please activate the logger first.");
      return;
    }

    const newLog = new MatchLog({
      matchId,
      region,
      logType,
      noOfPlayers,
      time: timeStamp,
      log,
      loggerId: existingLogger._id,
    });
    await newLog.save();

    existingLogger.logData.push(newLog._id as mongoose.Types.ObjectId);
    await existingLogger.save();

    await interaction.editReply("Match log saved successfully.");

    const matchLogChannel = interaction.guild.channels.cache.get(existingLogger.loggerChannelId) as TextChannel;
    if (!matchLogChannel || matchLogChannel.type !== ChannelType.GuildText) return;

    const readableTime = timeStamp.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short"
    });

    const embed = new EmbedBuilder()
      .setTitle("Match Log")
      .setDescription(
        `**Match ID:** ${matchId}\n` +
        `**Region:** ${region}\n` +
        `**Log Type:** ${logType}\n` +
        `**No. of Players:** ${noOfPlayers}\n` +
        `**Log:** ${log || "N/A"}\n` +
        `**Time:** ${readableTime}`
      )
      .setColor("#3498db")
      .setTimestamp()
      .setFooter({ text: `Log saved by ${interaction.user.tag}` });

    await matchLogChannel.send({ embeds: [embed] });

  } catch (error) {
    console.error("Error saving match log:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply("An error occurred while saving the match log.");
    } else {
      await interaction.reply("An error occurred while saving the match log.");
    }
  }
}

export async function activateLogger(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    if (!interaction.guild) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const guildId = interaction.guild.id;
    const loggerChannelName = interaction.options.getString("logger_channel")?.replace("#", "").toLowerCase();
    const channel = interaction.guild.channels.cache.find(
      (c) => c.name.toLowerCase() === loggerChannelName && c.type === ChannelType.GuildText
    ) as TextChannel;

    if (!channel) {
      await interaction.reply("Invalid channel specified. Please provide a valid text channel.");
      return;
    }

    const existingLogger = await MatchLogger.findOne({ guildId });

    if (existingLogger) {
      existingLogger.active = true;
      existingLogger.loggerChannelId = channel.id;
      await existingLogger.save();
    } else {
      const newLogger = new MatchLogger({
        guildId,
        active: true,
        loggerChannelId: channel.id,
        logData: [],
      });
      await newLogger.save();
    }

    await interaction.reply(`Logger activated successfully in ${channel}.`);
    logger.info(`Logger activated successfully in ${channel.name} for guild ${guildId}.`);

  } catch (error) {
    console.error("Error activating logger:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply("An error occurred while activating the logger.");
    } else {
      await interaction.reply("An error occurred while activating the logger.");
    }
  }
}

export async function deactivateLogger(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    if (!interaction.guild) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const guildId = interaction.guild.id;
    const existingLogger = await MatchLogger.findOne({ guildId });

    if (!existingLogger) {
      await interaction.reply("No active logger found for this guild.");
      return;
    }

    existingLogger.active = false;
    await existingLogger.save();

    await interaction.reply("Logger deactivated successfully.");
    logger.info(`Logger deactivated successfully for guild ${guildId}.`);

  } catch (error) {
    console.error("Error deactivating logger:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply("An error occurred while deactivating the logger.");
    } else {
      await interaction.reply("An error occurred while deactivating the logger.");
    }
  }
}