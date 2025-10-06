import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';

export const ticketCommands = [
	new SlashCommandBuilder()
		.setName('ticket-activate')
		.setDescription('Activate the ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('ticket-deactivate')
		.setDescription('Deactivate the ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('ticket-configure')
		.setDescription('Configure the ticket channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('Select the text channel for tickets')
				.addChannelTypes(ChannelType.GuildText)
		)
        .addChannelOption(option =>
			option
				.setName('transcript-channel')
				.setDescription('Select the text channel for ticket transcripts')
				.addChannelTypes(ChannelType.GuildText)
		),
];