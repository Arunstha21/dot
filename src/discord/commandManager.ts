
import { ticketCommands } from './ticket-tool/registerCommand';
import { logger } from './logger';
import { getCommandPermissionsRoute, getDeleteGuildCommandRoute, getGuildCommandList, getGuildCommandsRoute, rest } from './lib/discordApi';
import { matchLogCommands } from './matchLogs/registerCommands';
import { roleManagerCommands } from './role-manager/registerCommands';

export type ModuleType = 'match_logs' | 'role_manager' | 'ticket_tool' | 'all';

const commandMap: Record<ModuleType, any[]> = {
	match_logs: matchLogCommands,
	role_manager: roleManagerCommands,
	ticket_tool: ticketCommands,
    all: [...matchLogCommands, ...roleManagerCommands, ...ticketCommands],
};

export async function registerModuleCommands(module: ModuleType, guildId: string) {
	try {
		const commands = commandMap[module].map(cmd =>
            typeof cmd.toJSON === 'function' ? cmd.toJSON() : cmd.data.toJSON()
        );
		const registered = await rest.put(getGuildCommandsRoute(guildId), { body: commands });

		logger.info(`✅ Registered ${module} commands in guild ${guildId}`);

		// Set permissions if defined
		for (const cmd of commandMap[module]) {
			if (!cmd.permissions) continue;

			const registeredCmd = (registered as any[]).find(c => c.name === cmd.data.name);
			if (!registeredCmd) continue;

			await rest.put(
				getCommandPermissionsRoute(guildId),
				{ body: { permissions: cmd.permissions } }
			);

			logger.info(`🔐 Set permissions for ${cmd.data.name} in ${guildId}`);
		}
	} catch (err) {
		logger.error(`❌ Failed to register ${module} commands in guild ${guildId}:`, err);
		throw err;
	}
}

export async function deleteModuleCommand(module: ModuleType, guildId: string) {
	try {
		const existingCommands = await getGuildCommandList(guildId) as any[];

		const moduleCommandNames = commandMap[module].map(cmd => cmd.data.name);

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
