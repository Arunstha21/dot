export const runtime = "nodejs";

import {ChatInputCommandInteraction, Client, GatewayIntentBits, Partials} from 'discord.js';
import { close, email, verify } from './role-manager/commands';
import { activateLogger, deactivateLogger, matchLogger } from './matchLogs/matchLogger';
import { logger } from './logger';
import { deleteModuleCommand, ModuleType, registerModuleCommands } from './commandManager';
import { interactionCreate } from './ticket-tool/interactionCreate';
import { createDefaultHelpEmbed, createMatchLogsHelpEmbed, createRoleManagerHelpEmbed, createTicketToolHelpEmbed } from './help';
import { Guild } from '@/lib/database/guild';
import { MatchLogger } from '@/lib/database/matchLog';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildInvites,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

client.once('ready', () => {
  logger.info(`Discord client started as ${client.user?.tag}`);
});

client.on(interactionCreate.name, interactionCreate.execute);

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, guildId } = interaction;
    if (!guildId || !interaction.guild) return;

    const [roleManagerInfo, matchLoggerInfo] = await Promise.all([
        Guild.findOne({ guildId }),
        MatchLogger.findOne({ guildId }),
    ]);

    if ((!roleManagerInfo || !roleManagerInfo.active) && (!matchLoggerInfo || !matchLoggerInfo.active)) return;
    const commands: Record<string, (interaction: ChatInputCommandInteraction) => Promise<void>> = {};

    if (roleManagerInfo?.active) {
        Object.assign(commands, {
            email,
            verify,
            close,
        });
    }

    if (matchLoggerInfo?.active) {
        Object.assign(commands, {
            log: matchLogger,
            activate: activateLogger,
            deactivate: deactivateLogger,
        });
    }

    const commandFunction = commands[commandName];
    if (commandFunction) {
        await commandFunction(interaction as ChatInputCommandInteraction);
    }
});

const moduleHelpMap = {
	match_logs: createMatchLogsHelpEmbed,
	role_manager: createRoleManagerHelpEmbed,
	ticket_tool: createTicketToolHelpEmbed,
};

const validModules = Object.keys(moduleHelpMap).concat('all');

client.on('messageCreate', async (message) => {
	if (message.author.bot || !message.guild) return;

	const botMention = `<@${client.user?.id}>`;
	if (!message.mentions.has(client.user!)) return;

	const content = message.content.replace(/<@!?(\d+)>/, '').trim();
	const [command, ...args] = content.split(/\s+/);
	const arg = args[0]?.toLowerCase();

	// Permission check
	const isAdmin = message.member?.permissions.has('Administrator') || message.guild.ownerId === message.author.id;

	// === Command: register or delete ===
	if ((command === 'register' || command === 'delete') && arg) {
		if (!isAdmin) {
			await message.reply('You do not have permission to use this command.');
			return;
		}

		if (!validModules.includes(arg)) {
			await message.reply(`❌ Invalid module name. Use 'match_logs', 'role_manager', 'ticket_tool', or 'all'.`);
			return;
		}

		try {
			if (command === 'register') {
				await registerModuleCommands(arg as ModuleType, message.guild.id);
				await message.reply(`✅ Successfully registered commands for **${arg}**.`);
			} else {
				await deleteModuleCommand(arg as ModuleType, message.guild.id);
				await message.reply(`🗑️ Successfully deleted commands for **${arg}**.`);
			}
		} catch (error) {
			logger.error(`❌ Failed to ${command} commands for ${arg}:`, error);
			await message.reply(`⚠️ Failed to ${command} commands for **${arg}**. Check logs.`);
		}
		return;
	}

	if (command === 'help' || command === 'h') {
		if (arg && arg in moduleHelpMap) {
			const embedFn = moduleHelpMap[arg as keyof typeof moduleHelpMap];
			await message.reply({ embeds: [embedFn()] });
		} else {
			await message.reply({ embeds: [createDefaultHelpEmbed(botMention)] });
		}
	}
});


// client.on('channelDelete', async (channel) => {
//   if (!('guild' in channel) || !channel.guild) return;
//     logger.info(`Channel deleted: ${channel.name} (${channel.id}) in guild ${channel.guild.name} (${channel.guild.id})`);
//     // Additional logic can be added here if needed
// });

client.on('error', (error) => {
  console.error('Discord client encountered an error:', error);
});


export const startDiscordClient = async (token: string) => {
  try {
    await client.login(token);
    logger.info('Discord client started successfully.');
  } catch (error) {
    logger.error('Failed to start Discord client:', error);
  }
}