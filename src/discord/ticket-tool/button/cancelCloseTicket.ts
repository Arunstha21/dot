import { ButtonInteraction, MessageFlags } from 'discord.js';

export async function handleCancelClose(interaction: ButtonInteraction) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply({
      content: '❌ Ticket close cancelled.',
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await interaction.editReply({ content: '❌ Ticket close cancelled.', components: [] });
  }
  const oldMessage = interaction.message;
  if (oldMessage && oldMessage.deletable) {
    try {
      await oldMessage.delete();
    } catch (error) {
      console.error('Failed to delete old message:', error);
    }
  }
}