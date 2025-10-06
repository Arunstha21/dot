import {
  ButtonInteraction,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export async function handleManualConfigureTicketButton(interaction: ButtonInteraction) {
  const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('select_ticket_channel')
      .setPlaceholder('Choose a ticket channel...')
      .addChannelTypes(ChannelType.GuildText)
  );

  const row2 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('select_transcript_channel')
      .setPlaceholder('Choose a transcript channel...')
      .addChannelTypes(ChannelType.GuildText)
  );

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_manual_configure')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents( cancelButton);

  await interaction.reply({
    content: 'Select channels for ticket messages:',
    components: [row1, row2, confirmRow],
    flags: MessageFlags.Ephemeral,
  });
}