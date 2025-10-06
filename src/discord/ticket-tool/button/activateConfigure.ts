import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { createSimpleEmbed } from "../utils/response";

export async function handleActivateConfigure(interaction: ButtonInteraction | ChatInputCommandInteraction){
    const manualConfigButton = new ButtonBuilder()
        .setCustomId('manual_configure_ticket')
        .setLabel('Configure Ticket System Manually')
        .setStyle(ButtonStyle.Primary);

    const defaultConfigButton = new ButtonBuilder()
        .setCustomId('auto-ticket-configure')
        .setLabel('Configure Ticket System Automatically')
        .setStyle(ButtonStyle.Primary);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(manualConfigButton);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(defaultConfigButton);

    await interaction.reply({
        embeds: [createSimpleEmbed('⚙️ No configuration found. Please select both ticket and transcript channels.')],
        components: [row1, row2],
        flags: MessageFlags.Ephemeral,
    });
}