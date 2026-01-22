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

export async function handleConfirmClose(interaction: ButtonInteraction) {
  const { channel, guild, user } = interaction;

  if (!channel || channel.type !== ChannelType.GuildText || !guild) return;

  const channelName = channel.name;
  const ticketIdMatch = channelName.match(/ticket-(\d+)/);
  const ticketId = ticketIdMatch ? ticketIdMatch[1] : 'unknown';
  const ticketDocument = await TicketDocument.findOne({ channelId: channel.id });

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const COOLDOWN_MS = 10 * 60 * 1000;

    if (ticketDocument?.renameTimestamp && Date.now() - ticketDocument.renameTimestamp.getTime() < COOLDOWN_MS) {
        const remaining = COOLDOWN_MS - (Date.now() - ticketDocument.renameTimestamp.getTime());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.ceil((remaining % 60000) / 1000);

        await channel.send({
            content: `⚠️ Skipping channel rename. Cooldown remaining: ${minutes} min ${seconds} sec.`,
        });
    } else {
        await channel.setName(`closed-${ticketId}`);

        if (ticketDocument) {
            ticketDocument.renameTimestamp = new Date();
            await ticketDocument.save();
        }
    }

    const closedEmbed = new EmbedBuilder()
      .setDescription(`This ticket has been closed by <@${user.id}>.`)
      .setColor('Red')

    const controlsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('transcript_ticket')
        .setLabel('Transcript')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('reopen_ticket')
        .setLabel('Open')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('delete_ticket')
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [closedEmbed] });
    await channel.send({
      content: 'Support team ticket controls:',
      components: [controlsRow]
    });

    await interaction.editReply({ content: '✅ Ticket closed.', components: [] });
    await TicketDocument.findOneAndUpdate(
        { channelId: channel.id },
        { status: 'closed', closedBy: user.id }
    );
    const oldMessageId = interaction.message?.id;
    if (oldMessageId) {
      const oldMessage = await channel.messages.fetch(oldMessageId);
      if (oldMessage) {
        await oldMessage.delete();
      }
    }
  } catch (err) {
    logger.error('Error closing ticket:', err);
    await interaction.editReply({ content: '❌ Failed to close the ticket.', components: [] });
  }
}