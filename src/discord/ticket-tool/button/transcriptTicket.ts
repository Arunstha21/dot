import { ButtonInteraction, AttachmentBuilder, ChannelType, MessageFlags } from 'discord.js';
import { createTranscriptHtml } from '../utils/transcript';
import { TicketConfig } from '@/lib/database/ticket';


export async function handleTranscriptTicket(interaction: ButtonInteraction) {
    if (!interaction.guildId) {
        await interaction.reply({
        content: '❌ This command can only be used in a server.',
        flags: MessageFlags.Ephemeral
        });
        return;
    }
  const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guildId });
  if (!ticketConfig || !ticketConfig.transcriptChannel) {
    await interaction.reply({
      content: '❌ Transcript channel is not configured. Please set it up first.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }
  const { channel } = interaction;

  if (!channel || channel.type !== ChannelType.GuildText) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const transcriptBuffer = await createTranscriptHtml(channel);
  const attachment = new AttachmentBuilder(transcriptBuffer, {
    name: `${channel.name}_transcript.html`
  });

  const transcriptChannel = interaction.guild?.channels.cache.get(ticketConfig.transcriptChannel);

  if (transcriptChannel && transcriptChannel.type === ChannelType.GuildText) {
    await (transcriptChannel as import('discord.js').TextChannel).send({
      content: `📄 Transcript for ${channel.name}`,
      files: [attachment]
    });
  }
    await interaction.editReply({
        content: `✅ Transcript for ${channel.name} has been sent to <#${ticketConfig.transcriptChannel}>.`,
    });
}