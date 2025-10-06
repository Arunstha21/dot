import { ChannelSelectMenuInteraction, ChannelType, MessageFlags, TextChannel } from 'discord.js';
import { handleError } from '../utils/errors';
import { configureTicketInternal } from '../utils/configure';

const tempTicketSelections = new Map<string, { ticketChannelId?: string; transcriptChannelId?: string }>();

export async function handleChannelSelect(interaction: ChannelSelectMenuInteraction): Promise<void> {
  try {
    const channel = interaction.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: '❌ Please select a valid **text** channel.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guildId = interaction.guildId!;
    const existing = tempTicketSelections.get(guildId) || {};

    if (interaction.customId === 'select_ticket_channel') {
      existing.ticketChannelId = channel.id;
    } else if (interaction.customId === 'select_transcript_channel') {
      existing.transcriptChannelId = channel.id;
    }

    tempTicketSelections.set(guildId, existing);

    // Check if both are now selected
    if (existing.ticketChannelId && existing.transcriptChannelId) {
      tempTicketSelections.delete(guildId);

      await configureTicketInternal(interaction,
        interaction.guild?.channels.cache.get(existing.ticketChannelId) as TextChannel,
        interaction.guild?.channels.cache.get(existing.transcriptChannelId) as TextChannel
      );
    } else {
      await interaction.reply({
        content: `✅ ${interaction.customId === 'select_ticket_channel' ? 'Ticket' : 'Transcript'} channel set to <#${channel.id}>. Please select the other channel.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (error) {
    await handleError(interaction, error);
  }
}
