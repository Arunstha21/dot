import { EmbedBuilder } from 'discord.js';

export function createDefaultHelpEmbed(botMention: string) {
	return new EmbedBuilder()
		.setTitle('📦 Command Modules Help')
		.setColor(0x5865f2)
		.setDescription(
			`Use the following syntax to register or delete commands:\n\n` +
			`> ${botMention} register <module>\n` +
			`> ${botMention} delete <module>\n\n` +
			`Available modules:\n` +
			`- \`match_logs\`\n` +
			`- \`role_manager\`\n` +
			`- \`ticket_tool\`\n` +
			`- \`all\`\n\n` +
			`Use ${botMention} help <module> to get detailed info about any module.`
		)
		.addFields(
			{
				name: '🎮 match_logs',
				value:
					'`/matchlog` — Log match details including region, type, and player count.\n'+
                    '`/activate_logger` — Activate the match logger for this server.\n' +
                    '`/matchlog_deactivate` — Deactivate the match logger for this server.',

			},
			{
				name: '🛂 role_manager',
				value:
					'`/email` — Send verification code to an email.\n' +
					'`/verify` — Verify user with the OTP.\n' +
					'`/close` — Close the current ticket channel (Admin only).',
			},
			{
				name: '🎫 ticket_tool',
				value:
					'`/ticket-activate` — Activate the ticket system.\n' +
					'`/ticket-deactivate` — Deactivate the ticket system.\n' +
					'`/ticket-configure` — Configure ticket & transcript channels.',
			},
		)
		.setFooter({ text: 'Only users with permission to manage commands should use these operations.' });
}

export function createMatchLogsHelpEmbed() {
	return new EmbedBuilder()
		.setTitle('🎮 match_logs Module')
		.setColor(0x1abc9c)
		.setDescription('Provides a single command to log match events.')
		.addFields({
			name: '`/matchlog`',
			value: [
				'**Description:** Log match details including region, type, and player count.',
				'**Options:**',
				'- `match_id` (string, required)',
				'- `region` (choice: asia, europe, etc., required)',
				'- `log_type` (choice: match_start, match_end, issue, required)',
				'- `no_of_players` (integer, required)',
				'- `log` (string, optional)',
			].join('\n'),
		});
}

export function createRoleManagerHelpEmbed() {
	return new EmbedBuilder()
		.setTitle('🛂 role_manager Module')
		.setColor(0xf1c40f)
		.setDescription('Verify users via email with OTP codes.')
		.addFields(
			{
				name: '`/email <email>`',
				value: 'Send a verification code to the specified email.',
			},
			{
				name: '`/verify <otp>`',
				value: 'Verify yourself using the OTP received via email.',
			},
			{
				name: '`/close`',
				value: 'Admin only: Close the current ticket channel.',
			},
		);
}


export function createTicketToolHelpEmbed() {
	return new EmbedBuilder()
		.setTitle('🎫 ticket_tool Module')
		.setColor(0xe67e22)
		.setDescription('Manage the ticket system (Admin only).')
		.addFields(
			{
				name: '`/ticket-activate`',
				value: 'Enable the ticket system.',
			},
			{
				name: '`/ticket-deactivate`',
				value: 'Disable the ticket system.',
			},
			{
				name: '`/ticket-configure <channel> <transcript-channel>`',
				value: 'Set ticket and transcript channels.',
			},
		);
}

