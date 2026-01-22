import {
	ChatInputCommandInteraction,
	ButtonInteraction,
	StringSelectMenuInteraction,
	ModalSubmitInteraction,
	AnySelectMenuInteraction,
	Interaction,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
} from 'discord.js';

/**
 * Type for interactions that support reply methods
 * This represents interactions that have reply, editReply, deferReply, etc. methods
 */
export type InteractionReplyable =
	| ChatInputCommandInteraction
	| MessageContextMenuCommandInteraction
	| UserContextMenuCommandInteraction
	| ButtonInteraction
	| AnySelectMenuInteraction
	| ModalSubmitInteraction;

/**
 * Type for interactions that can be collected in a collector
 */
export type InteractionCollectableInteraction =
	| ChatInputCommandInteraction
	| ButtonInteraction
	| AnySelectMenuInteraction
	| ModalSubmitInteraction;

/**
 * Type guard to check if an interaction is a ChatInputCommandInteraction
 */
export function isChatInputCommand(interaction: Interaction): interaction is ChatInputCommandInteraction {
	return interaction.isChatInputCommand();
}

/**
 * Type guard to check if an interaction is a ButtonInteraction
 */
export function isButton(interaction: Interaction): interaction is ButtonInteraction {
	return interaction.isButton();
}

/**
 * Type guard to check if an interaction is a SelectMenuInteraction
 */
export function isSelectMenu(interaction: Interaction): interaction is AnySelectMenuInteraction {
	return interaction.isAnySelectMenu();
}

/**
 * Type guard to check if an interaction is a StringSelectMenuInteraction
 */
export function isStringSelectMenu(interaction: Interaction): interaction is StringSelectMenuInteraction {
	return interaction.isStringSelectMenu();
}

/**
 * Type guard to check if an interaction is a ModalSubmitInteraction
 */
export function isModal(interaction: Interaction): interaction is ModalSubmitInteraction {
	return interaction.isModalSubmit();
}

/**
 * Type guard for replyable interactions
 * Ensures the interaction has methods like reply, editReply, etc.
 */
export function isReplyable(interaction: Interaction): interaction is InteractionReplyable {
	return 'reply' in interaction;
}

/**
 * Type guard for collectable interactions
 * Ensures the interaction can be collected in a collector
 */
export function isCollectable(interaction: Interaction): interaction is InteractionCollectableInteraction {
	return 'isChatInputCommand' in interaction || 'isButton' in interaction || 'isAnySelectMenu' in interaction || 'isModalSubmit' in interaction;
}
