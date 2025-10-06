import { TicketConfig } from '../../../lib/database/ticket';

export async function getTicketConfig(guildId: string) {
  return await TicketConfig.findOne({ guildId });
}

export async function createOrUpdateTicketConfig(guildId: string, channelId: string, transcriptChannelId: string) {
  return await TicketConfig.findOneAndUpdate(
    { guildId },
    { ticketChannel: channelId, transcriptChannel: transcriptChannelId, status: 'active' },
    { upsert: true, new: true }
  );
}

export async function deactivateTicketConfig(guildId: string) {
  return await TicketConfig.findOneAndUpdate(
    { guildId },
    { status: 'inactive' }
  );
}