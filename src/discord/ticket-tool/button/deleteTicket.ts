import { ButtonInteraction, ChannelType, MessageFlags } from 'discord.js';

export async function handleDeleteTicket(interaction: ButtonInteraction) {
  const { channel, user } = interaction;

  if (!channel || channel.type !== ChannelType.GuildText) return;

  await interaction.reply({
    content: '🗑️ Deleting ticket channel...',
    flags: MessageFlags.Ephemeral
  });

  await channel.send(`🔒 Ticket deleted by <@${user.id}>.`);

  setTimeout(() => {
    channel.delete('Ticket closed and deleted by user');
  }, 2000);
}