import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const matchLogCommands = [
	new SlashCommandBuilder()
		.setName('matchlog')
		.setDescription('Log match details including region, type, and player count')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName('match_id')
				.setDescription('Enter the match ID')
				.setRequired(true),
		)
		.addStringOption(option =>
			option.setName('region')
				.setDescription('Select the region')
				.setRequired(true)
				.addChoices(
					{ name: 'Asia', value: 'asia' },
					{ name: 'Europe', value: 'europe' },
					{ name: 'Middle East', value: 'middle_east' },
					{ name: 'North America', value: 'north_america' },
					{ name: 'South America', value: 'south_america' },
				),
		)
		.addStringOption(option =>
			option.setName('log_type')
				.setDescription('Select the type of log')
				.setRequired(true)
				.addChoices(
					{ name: 'Match Start', value: 'match_start' },
					{ name: 'Match End', value: 'match_end' },
					{ name: 'Issue', value: 'issue' },
				),
		)
		.addIntegerOption(option =>
			option.setName('no_of_players')
				.setDescription('Enter the number of players')
				.setRequired(true),
		)
		.addStringOption(option =>
			option.setName('log')
				.setDescription('Optional log message (additional details)')
				.setRequired(false),
		),
    new SlashCommandBuilder()
        .setName('activate_logger')
        .setDescription('Activate the match logger for this guild')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('logger_channel')
                .setDescription('Select the text channel for match logs')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    new SlashCommandBuilder()
        .setName('matchlog_deactivate')
        .setDescription('Deactivate the match logger for this guild')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];