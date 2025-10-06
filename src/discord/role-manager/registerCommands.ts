import { SlashCommandBuilder } from 'discord.js';

export const roleManagerCommands = [
	new SlashCommandBuilder()
		.setName('email')
		.setDescription('Send a verification code to the given email')
		.addStringOption(option =>
			option.setName('email')
				.setDescription('The email address to send the code to')
				.setRequired(true),
		),

	new SlashCommandBuilder()
		.setName('verify')
		.setDescription('Verify user with the given OTP')
		.addNumberOption(option =>
			option.setName('otp')
				.setDescription('OTP code received via email')
				.setRequired(true),
		),

	new SlashCommandBuilder()
		.setName('close')
		.setDescription('Close the current ticket channel (Admin only)'),
];