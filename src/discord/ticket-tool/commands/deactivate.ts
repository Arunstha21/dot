import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { createSimpleEmbed } from '../utils/response';
import { handleError } from '../utils/errors';
import { deactivateTicketConfig } from '../services/ticketConfig';

export async function deactivateTicket(interaction: ChatInputCommandInteraction) {
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
    const guildId = interaction.guild?.id;
    if (!guildId) {
        await interaction.reply({ content: 'Must be used in a server.', flags: MessageFlags.Ephemeral });
        return;
    }

    const result = await deactivateTicketConfig(guildId);
    if (!result) {
        await interaction.reply({ content: 'No config found.', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.reply({ embeds: [createSimpleEmbed('Ticket system deactivated.')] });
  } catch (error) {
    await handleError(interaction, error);
  }
}