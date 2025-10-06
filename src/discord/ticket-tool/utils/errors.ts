import { logger } from "@/discord/logger";
import { MessageFlags } from "discord.js";

export const handleError = async (
  interaction: any,
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