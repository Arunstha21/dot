import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from 'discord.js';

export async function handleCloseTicketPrompt(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText)
    return;

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('confirm_close').setLabel('Close').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('cancel_close').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    content: '❗ Are you sure you would like to close this ticket?',
    components: [confirmRow]
  });
}