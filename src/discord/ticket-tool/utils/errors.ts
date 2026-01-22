import { logger } from "@/discord/logger";
import { MessageFlags, ChatInputCommandInteraction, ButtonInteraction, AnySelectMenuInteraction } from "discord.js";

// Type union for interactions that can reply
type ReplyableInteraction = ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction;

export const handleError = async (
  interaction: ReplyableInteraction,
  error: unknown,
  userMessage = 'An unexpected error occurred.'
) => {
  logger.error(error);
  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ content: userMessage });
  } else {
    await interaction.reply({ content: userMessage, flags: MessageFlags.Ephemeral});
  }
};