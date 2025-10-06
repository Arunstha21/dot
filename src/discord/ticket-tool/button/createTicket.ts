import {
  ButtonInteraction,
  GuildMember,
  ChannelType,
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { getTicketConfig } from '../services/ticketConfig';
import { handleError } from '../utils/errors';
import { TicketDocument } from '@/lib/database/ticket';

export async function handleCreateTicket(interaction: ButtonInteraction) {
  try {
    const guild = interaction.guild;
    if (!guild) return;

    const config = await getTicketConfig(guild.id);
    if (!config || config.status !== 'active') {
      await interaction.reply({
        content: '❌ The ticket system is currently inactive.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const member = interaction.member as GuildMember;
    const existingTicket = await TicketDocument.findOne({ userId: member.id, status: 'open' });
    if (existingTicket) {
      await interaction.reply({
        content: `❌ You already have an open ticket: <#${existingTicket.channelId}>`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const category = guild.channels.cache.find(
      (ch) => ch.name === 'Tickets' && ch.type === ChannelType.GuildCategory
    );

    if (!category) {
      await interaction.reply({
        content: '❌ The ticket category "Tickets" was not found in this server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Create ticket channel
    const channel = await guild.channels.create({
      name: `ticket-${config.ticketCount + 1}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks,
          ],
        },
      ],
      reason: `Ticket created by ${member.user.tag}`,
    });

    // Increment ticket count in DB
    config.ticketCount += 1;
    await config.save();

    // Build Welcome Embed
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🎫 New Ticket')
      .setDescription(`Hi <@${member.id}>, welcome! Our team will be with you shortly.\n\nUse the button below to close this ticket when you're done.`)
      .setColor('#00b0f4')
      .setFooter({ text: `Ticket ID: ${channel.name}` });

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

    // Send welcome message in ticket channel
    await channel.send({
      content: `<@${member.id}>`,
      embeds: [welcomeEmbed],
      components: [row],
    });

    // Respond to the button interaction
    await interaction.reply({
      content: `✅ Your ticket has been created: ${channel}`,
      flags: MessageFlags.Ephemeral,
    });

    await TicketDocument.create({
        guildId: guild.id,
        channelId: channel.id,
        userId: member.id,
        status: 'open'
    });

  } catch (error) {
    await handleError(interaction, error);
  }
}