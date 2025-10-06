import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

// Routes for commands
export function getGuildCommandsRoute(guildId: string) {
	return Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId);
}

export function getSingleCommandRoute(commandId: string, guildId: string) {
	return Routes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID!, guildId, commandId);
}

// Route for setting permissions
export function getCommandPermissionsRoute(guildId: string) {
  return Routes.guildApplicationCommandsPermissions(
    process.env.DISCORD_CLIENT_ID!,
    guildId
  );
}

export async function getGuildCommandList(guildId: string) {
	return rest.get(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId)) as Promise<any[]>;
}

// Route to delete a command using its ID (helper for deleteModuleCommand)
export function getDeleteGuildCommandRoute(commandId: string, guildId: string) {
	return Routes.applicationGuildCommand(process.env.DISCORD_CLIENT_ID!, guildId, commandId);
}

export { rest };