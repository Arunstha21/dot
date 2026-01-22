import { logger } from '@/discord/logger';
import { Interaction, MessageFlags } from 'discord.js';
import { isReplyable } from './typeGuards';

/**
 * Error types for better error categorization
 */
export enum ErrorType {
	API_ERROR = 'API_ERROR',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	PERMISSION_ERROR = 'PERMISSION_ERROR',
	NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
	RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for Discord operations
 */
export class DiscordError extends Error {
	constructor(
		public type: ErrorType,
		message: string,
		public originalError?: unknown
	) {
		super(message);
		this.name = 'DiscordError';
	}
}

/**
 * Categorizes an error into our ErrorType enum
 */
function categorizeError(error: unknown): ErrorType {
	if (error instanceof DiscordError) {
		return error.type;
	}

	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		if (message.includes('rate limit') || message.includes('429')) {
			return ErrorType.RATE_LIMIT_ERROR;
		}
		if (message.includes('permission') || message.includes('403') || message.includes('missing access')) {
			return ErrorType.PERMISSION_ERROR;
		}
		if (message.includes('not found') || message.includes('404') || message.includes('unknown')) {
			return ErrorType.NOT_FOUND_ERROR;
		}
		if (message.includes('invalid') || message.includes('validation')) {
			return ErrorType.VALIDATION_ERROR;
		}
	}

	return ErrorType.UNKNOWN_ERROR;
}

/**
 * Generates user-friendly error messages based on error type
 */
function getUserMessage(errorType: ErrorType, defaultMsg?: string): string {
	switch (errorType) {
		case ErrorType.RATE_LIMIT_ERROR:
			return 'You are being rate limited. Please wait a moment before trying again.';
		case ErrorType.PERMISSION_ERROR:
			return 'I do not have permission to perform this action.';
		case ErrorType.NOT_FOUND_ERROR:
			return 'The requested resource was not found.';
		case ErrorType.VALIDATION_ERROR:
			return 'Invalid input. Please check your input and try again.';
		case ErrorType.API_ERROR:
			return 'There was an error communicating with Discord. Please try again.';
		default:
			return defaultMsg || 'An unexpected error occurred. Please try again.';
	}
}

/**
 * Handles errors in a standardized way
 * - Logs the error with full context
 * - Returns a user-friendly message for the interaction
 *
 * @param error - The error that occurred
 * @param interaction - The Discord interaction (optional)
 * @param userMessage - Custom user message (optional)
 * @returns The user-friendly error message
 */
export async function handleError(
	error: unknown,
	interaction?: Interaction,
	userMessage?: string
): Promise<string> {
	const errorType = categorizeError(error);

	// Log the error with context
	if (error instanceof Error) {
		logger.error(`[${errorType}] ${error.message}`, {
			stack: error.stack,
			interaction: interaction ? {
				id: interaction.id,
				type: interaction.type,
				user: interaction.user.id,
				guild: interaction.guildId,
			} : undefined,
		});
	} else {
		logger.error(`[${errorType}] Unknown error:`, error);
	}

	const message = getUserMessage(errorType, userMessage);

	// Reply to interaction if provided
	if (interaction && isReplyable(interaction)) {
		try {
			const replyable = interaction as Interaction & { replied: boolean; deferred: boolean; editReply: (options: { content: string }) => Promise<unknown>; reply: (options: { content: string; flags: number }) => Promise<unknown> };
			if (replyable.replied || replyable.deferred) {
				await replyable.editReply({ content: message });
			} else {
				await replyable.reply({
					content: message,
					flags: MessageFlags.Ephemeral,
				});
			}
		} catch (replyError) {
			logger.error('Failed to send error reply:', replyError);
		}
	}

	return message;
}

/**
 * Wraps an async function with error handling
 * Useful for command handlers that need consistent error handling
 */
export function withErrorHandling<T extends Interaction>(
	fn: (interaction: T) => Promise<void>,
	defaultErrorMessage = 'An unexpected error occurred.'
): (interaction: T) => Promise<void> {
	return async (interaction: T) => {
		try {
			await fn(interaction);
		} catch (error) {
			await handleError(error, interaction, defaultErrorMessage);
		}
	};
}

/**
 * Safe error handler that never throws
 * Use this in cleanup routines or error handlers to prevent cascading failures
 */
export function safeErrorHandler(error: unknown, context?: string): void {
	try {
		logger.error(`[Safe Error Handler${context ? ` - ${context}` : ''}]:`, error);
	} catch {
		// Last resort - if logging fails, there's nothing we can do
		console.error('Critical error in error handler:', error);
	}
}
