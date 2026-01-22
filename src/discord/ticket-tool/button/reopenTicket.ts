import { TicketDocument } from '@/lib/database/ticket';
import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags
} from 'discord.js';
import { logger } from '../../logger';

export async function handleReopenTicket(interaction: ButtonInteraction) {
  const { channel, user } = interaction;

  if (!channel || channel.type !== ChannelType.GuildText) return;

  const ticketIdMatch = channel.name.match(/(?:ticket|closed)-(\d+)/);
  const ticketId = ticketIdMatch ? ticketIdMatch[1] : 'unknown';

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const ticketDocument = await TicketDocument.findOne({ channelId: channel.id });
    // Rename the channel
    if( channel.name.startsWith('closed-')) {
      await channel.setName(`ticket-${ticketId}`);
        if (ticketDocument) {
            ticketDocument.renameTimestamp = new Date();
            await ticketDocument.save();
        }
    }

    // Create reopened message
    const embed = new EmbedBuilder()
      .setDescription(`This ticket was reopened by <@${user.id}>.`)
      .setColor('Green')
      .setTimestamp();

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

    await channel.send({ embeds: [embed], components: [row] });

    // Confirmation reply
    await interaction.editReply({ content: '✅ Ticket reopened.', components: [] });
    const oldMessageId = interaction.message?.id;
    if (oldMessageId) {
      const oldMessage = await channel.messages.fetch(oldMessageId);
      if (oldMessage) {
        await oldMessage.delete();
      }
    }

    // Update database
    await TicketDocument.findOneAndUpdate(
      { channelId: channel.id },
      { status: 'open', closedBy: null, closeReason: null }
    );
  } catch (err) {
    logger.error('Error reopening ticket:', err);
    await interaction.editReply({ content: '❌ Failed to reopen the ticket.' });
  }
}