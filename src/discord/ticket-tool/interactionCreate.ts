import { ChatInputCommandInteraction, ButtonInteraction, ChannelSelectMenuInteraction, Interaction, MessageFlags } from 'discord.js';
import { activateTicket } from './commands/activate';
import { deactivateTicket } from './commands/deactivate';
import { configureTicket } from './commands/configure';
import { handleCreateTicket } from './button/createTicket';
import { handleChannelSelect } from './menus/selectTicketChannel';
import { handleCloseTicketPrompt } from './button/closeTicket';
import { handleConfirmClose } from './button/confirmCloseTicket';
import { handleCancelClose } from './button/cancelCloseTicket';
import { handleReopenTicket } from './button/reopenTicket';
import { handleDeleteTicket } from './button/deleteTicket';
import { handleTranscriptTicket } from './button/transcriptTicket';
import { handleManualConfigureTicketButton } from './button/manualConfigureTicket';
import { autoConfigureTicket } from './button/autoTicketConfigure';
import { handleActivateConfigure } from './button/activateConfigure';

export const commandHandlers: Record<string, (interaction: ChatInputCommandInteraction) => Promise<void>> = {
  'ticket-activate': activateTicket,
  'ticket-deactivate': deactivateTicket,
  'ticket-configure': configureTicket,
};

export const buttonHandlers: Record<string, (interaction: ButtonInteraction) => Promise<void>> = {
  'manual_configure_ticket': handleManualConfigureTicketButton,
  'cancel_manual_configure': handleActivateConfigure,
  'auto-ticket-configure': autoConfigureTicket,
  'create_ticket': handleCreateTicket,
  'close_ticket': handleCloseTicketPrompt,
  'confirm_close': handleConfirmClose,
  'cancel_close': handleCancelClose,
  'transcript_ticket': handleTranscriptTicket,
  'reopen_ticket': handleReopenTicket,
  'delete_ticket': handleDeleteTicket
};

export const selectMenuHandlers: Record<string, (interaction: ChannelSelectMenuInteraction) => Promise<void>> = {
  'select_ticket_channel': handleChannelSelect,
  'select_transcript_channel': handleChannelSelect
};

export const interactionCreate = {
  name: 'interactionCreate',
  async execute(interaction: Interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const handler = commandHandlers[interaction.commandName];
        if (handler) return await handler(interaction);
      }

      else if (interaction.isButton()) {
        const handler = buttonHandlers[interaction.customId];
        if (handler) return await handler(interaction);
      }

      else if (interaction.isChannelSelectMenu()) {
        const handler = selectMenuHandlers[interaction.customId];
        if (handler) return await handler(interaction);
      }

    } catch (error) {
      console.error(`Interaction handler error: ${error}`);
      if (
        (interaction.isChatInputCommand() ||
          interaction.isButton() ||
          interaction.isChannelSelectMenu()) &&
        !interaction.replied
      ) {
        await interaction.reply({ content: '❌ An error occurred while processing your interaction.', flags: MessageFlags.Ephemeral });
      }
    }
  }
};