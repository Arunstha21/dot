import {
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { getTicketConfig } from '../services/ticketConfig';
import { createSimpleEmbed } from '../utils/response';
import { handleError } from '../utils/errors';
import { handleActivateConfigure } from '../button/activateConfigure';

export async function activateTicket(interaction: ChatInputCommandInteraction) {
  try {
    const memberPermissions = interaction.member?.permissions;
    if (
      !memberPermissions ||
      (typeof memberPermissions !== 'string' && !memberPermissions.has(PermissionFlagsBits.ManageGuild))
    ) {
      await interaction.reply({
        content: '❌ You do not have permission to activate the ticket system.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (!interaction.guild) {
      await interaction.reply({ content: 'Use in a server only.', flags: MessageFlags.Ephemeral, });
      return;
    }

    const guildId = interaction.guild.id;
    const config = await getTicketConfig(guildId);

    if (!config) {
      await handleActivateConfigure(interaction);
      return;
    }

    // Activate if config exists
    config.status = 'active';
    if (typeof config.save === 'function') {
      await config.save();
    }

    await interaction.reply({
      embeds: [createSimpleEmbed('✅ Ticket system activated.')],
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    await handleError(interaction, error);
  }
}
