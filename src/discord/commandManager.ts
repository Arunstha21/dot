
import { ticketCommands } from './ticket-tool/registerCommand';
import { logger } from './logger';
import { getCommandPermissionsRoute, getDeleteGuildCommandRoute, getGuildCommandList, getGuildCommandsRoute, rest } from './lib/discordApi';
import { matchLogCommands } from './matchLogs/registerCommands';
import { roleManagerCommands } from './role-manager/registerCommands';
import { RESTPutAPIApplicationCommandsJSONBody, APIApplicationCommand } from 'discord.js';

export type ModuleType = 'match_logs' | 'role_manager' | 'ticket_tool' | 'all';

// Type for objects with toJSON method (all Discord.js builders have this)
interface ToJSONable {
	toJSON(): RESTPutAPIApplicationCommandsJSONBody[number];
	name: string;
}

// Base type for command objects - either direct builders or wrapped objects
type CommandObject = ToJSONable | { data: ToJSONable; permissions?: Array<{ id: string; type: number; permission: boolean }> };

const commandMap: Record<ModuleType, CommandObject[]> = [
	['match_logs', matchLogCommands],
	['role_manager', roleManagerCommands],
	['ticket_tool', ticketCommands],
	['all', [...matchLogCommands, ...roleManagerCommands, ...ticketCommands]],
] as unknown as Record<ModuleType, CommandObject[]>;

export async function registerModuleCommands(module: ModuleType, guildId: string) {
	try {
		const commands: RESTPutAPIApplicationCommandsJSONBody = commandMap[module].map(cmd => {
			// If it's a direct builder with toJSON method
			if (typeof cmd === 'object' && 'toJSON' in cmd && typeof cmd.toJSON === 'function') {
				return (cmd as ToJSONable).toJSON();
			}
			// If it's wrapped in a data property
			if ('data' in cmd && typeof cmd.data === 'object' && 'toJSON' in cmd.data) {
				return (cmd.data as ToJSONable).toJSON();
			}
			// Fallback: try to call toJSON directly
			return (cmd as unknown as ToJSONable).toJSON();
		});

		const registered = await rest.put(getGuildCommandsRoute(guildId), { body: commands });

		logger.info(`✅ Registered ${module} commands in guild ${guildId}`);

		// Set permissions if defined for wrapped command objects
		for (const cmd of commandMap[module]) {
			if ('data' in cmd && cmd.permissions) {
				const commandName = (cmd.data as ToJSONable).name;
				const registeredCmd = (registered as APIApplicationCommand[]).find(c => c.name === commandName);
				if (!registeredCmd) continue;

				await rest.put(
					getCommandPermissionsRoute(guildId),
					{ body: { permissions: cmd.permissions } }
				);

				logger.info(`🔐 Set permissions for ${commandName} in ${guildId}`);
			}
		}
	} catch (err) {
		logger.error(`❌ Failed to register ${module} commands in guild ${guildId}:`, err);
		throw err;
	}
}

export async function deleteModuleCommand(module: ModuleType, guildId: string) {
	try {
		const existingCommands = await getGuildCommandList(guildId);

		// Get command names from the module's commands
		const moduleCommandNames = commandMap[module].map(cmd => {
			// Direct builder
			if (typeof cmd === 'object' && 'name' in cmd) {
				return (cmd as ToJSONable).name;
			}
			// Wrapped object
			if ('data' in cmd && typeof cmd.data === 'object' && 'name' in cmd.data) {
				return (cmd.data as ToJSONable).name;
			}
			return undefined;
		}).filter((name): name is string => name !== undefined);

		for (const command of existingCommands) {
			if (moduleCommandNames.includes(command.name)) {
				await rest.delete(getDeleteGuildCommandRoute(command.id, guildId));
				logger.info(`✅ Deleted ${module} command ${command.name} from guild ${guildId}`);
			}
		}
	} catch (err) {
		logger.error(`❌ Failed to delete ${module} commands from guild ${guildId}:`, err);
		throw err;
	}
}
