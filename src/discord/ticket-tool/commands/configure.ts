import {ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, TextChannel } from "discord.js";
import { configureTicketInternal } from "../utils/configure";

export async function configureTicket(interaction: ChatInputCommandInteraction) {
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
    const channel = interaction.options.getChannel('channel') as TextChannel;
    const transcriptChannel = interaction.options.getChannel('transcript-channel') as TextChannel;
    await configureTicketInternal(interaction, channel, transcriptChannel);
}
