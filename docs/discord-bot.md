# DOT Discord Bot Documentation

The DOT Discord bot provides modules for tournament management: Role Manager, Match Logger, Ticket System, and GAC (Game Account Credentials) integration. Each module can be activated or deactivated per guild.

## Table of Contents

- [Bot Architecture](#bot-architecture)
- [Setup and Installation](#setup-and-installation)
- [Command Management](#command-management)
- [Modules](#modules)
  - [Role Manager](#role-manager-module)
  - [Match Logger](#match-logger-module)
  - [Ticket System](#ticket-system-module)
  - [GAC Integration](#gac-integration)
- [Help System](#help-system)
- [Error Handling](#error-handling)

## Bot Architecture

The DOT bot uses a modular architecture where each module operates independently:

```
src/discord/
├── index.ts                 # Main bot entry point
├── commandManager.ts        # Command registration system
├── logger.ts               # Winston logger configuration
├── help.ts                 # Help embed generators
├── role-manager/           # Role Manager module
│   ├── commands.ts         # Command handlers
│   ├── helper/
│   │   ├── email.ts        # Email sending logic
│   │   └── tickets.ts      # Ticket creation logic
│   └── registerCommands.ts # Slash command definitions
├── matchLogs/              # Match Logger module
│   ├── matchLogger.ts      # Command handlers
│   └── registerCommands.ts # Slash command definitions
├── ticket-tool/            # Ticket System module
│   ├── interactionCreate.ts # Interaction router
│   ├── commands/           # Command handlers
│   ├── button/             # Button handlers
│   ├── menus/              # Select menu handlers
│   ├── utils/              # Utilities
│   └── registerCommand.ts  # Slash command definitions
└── lib/
    └── discordApi.ts       # Discord REST API wrapper
```

### Key Design Principles

1. **Modular Independence**: Each module can function without the others
2. **Per-Guild Configuration**: Modules are activated/deactivated per server
3. **Database-Driven**: All configurations stored in MongoDB
4. **Event-Driven**: Uses Discord.js events for real-time responses

## Setup and Installation

### 1. Bot Configuration

Ensure these environment variables are set:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_TOKEN=your_bot_token
```

### 2. Required Intents

The bot requires these Discord gateway intents:

```typescript
GatewayIntentBits.Guilds          // For guild/server info
GatewayIntentBits.GuildMembers    // For member join events
GatewayIntentBits.GuildMessages   // For message commands
GatewayIntentBits.MessageContent  // For message content parsing
GatewayIntentBits.GuildMessageReactions // For reaction events
GatewayIntentBits.GuildPresences  // For presence updates
GatewayIntentBits.GuildInvites    // For invite tracking
```

### 3. Required Partials

```typescript
Partials.Message
Partials.Channel
Partials.Reaction
Partials.GuildMember
Partials.User
```

### 4. Bot Permissions

When inviting the bot to a server, ensure these permissions:

- **Manage Roles** - Required for role assignment
- **Manage Channels** - Required for ticket creation
- **Manage Nicknames** - Required for nickname updates
- **Send Messages** - Required for all responses
- **Embed Links** - Required for formatted messages
- **Read Message History** - Required for context
- **Add Reactions** - Required for some interactions
- **Use Application Commands** - Required for slash commands

### 5. Invite URL Template

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=268445696&scope=bot%20applications.commands
```

Replace `CLIENT_ID` with your bot's client ID.

## Command Management

### Bot Mentions for Management

The bot responds to mentions for command management:

```
@DOT <command> [args]
```

### Available Management Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `register <module>` | Register slash commands for a module | Administrator |
| `delete <module>` | Delete slash commands for a module | Administrator |
| `help [module]` | Display help information | Anyone |

### Module Names

- `all` - All modules
- `role_manager` - Role Manager module
- `match_logs` - Match Logger module
- `ticket_tool` - Ticket System module

### Example Usage

```
@DOT register all           # Register all commands
@DOT register role_manager  # Register only role manager
@DOT delete ticket_tool      # Remove ticket commands
@DOT help                   # Show general help
@DOT help match_logs        # Show match logs help
```

## Modules

### Role Manager Module

Manages player verification through email-based OTP system.

#### Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `/email` | `email: string` | Send OTP to player's email |
| `/verify` | `otp: number` | Verify with OTP code |
| `/close` | (none) | Close ticket channel (admin only) |

#### Setup Process

1. **Web Dashboard Setup**:
   - Navigate to `/dashboard/role-manager` in the web app
   - Select or create a guild configuration
   - Add players with their emails and assign roles

2. **Player Verification Flow**:
   ```
   Player joins server → Creates ticket → Uses /email command
   → Receives OTP email → Uses /verify command
   → Gets roles assigned → Ticket closes
   ```

#### Features

- **Email OTP Verification**: 6-digit OTP sent via SendGrid
- **3-Attempt Limit**: Prevents brute force attacks
- **Automatic Role Assignment**: Assigns configured Discord roles
- **Nickname Updates**: Sets format "TAG | PlayerName"
- **Ticket Integration**: Creates tickets for unverified users
- **Admin Management**: Admins can close tickets manually

#### Verification States

| State | Description |
|-------|-------------|
| `unverified` | Email not sent, user not joined |
| `pending` | OTP sent, awaiting verification |
| `verified` | User verified and roles assigned |

#### Database Models

**Guild** (stored in MongoDB):
```typescript
{
  guildId: string,
  guildName: string,
  roleManager: boolean,
  users: RoleManagerUser[],
  admins: RoleManagerUser[]
}
```

**RoleManagerUser**:
```typescript
{
  userName: string,
  email: string,
  role: string[],
  otp?: number,
  emailSent: number,
  serverJoined: boolean,
  sender?: string,
  team?: ObjectId,
  player?: ObjectId
}
```

### Match Logger Module

Logs match data with formatted Discord embeds.

#### Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `/log` | `match_id`, `region`, `log_type`, `no_of_players`, `time`, `log` | Log match data |
| `/activate` | `logger_channel: string` | Activate logger for channel |
| `/deactivate` | (none) | Deactivate logger |

#### Setup Process

1. **Activate Logger**:
   ```
   /activate #match-logs
   ```

2. **Log Matches**:
   ```
   /log match_id:123 region:NA log_type:PP no_of_players:100 time:2024-01-15T14:00 log:"Match started"
   ```

#### Features

- **Structured Logging**: Stores all match data in MongoDB
- **Formatted Embeds**: Sends beautiful embeds to Discord
- **Per-Guild Configuration**: Each server can have different logger channels
- **Timestamp Support**: Accepts ISO format timestamps or defaults to now
- **Multiple Log Types**: Supports different log categories (PP, TPP, etc.)

#### Log Embed Format

```
Match Log
━━━━━━━━━━━━━━━━
Match ID: 123
Region: NA
Log Type: PP
No. of Players: 100
Log: Match started
Time: Jan 15, 2024, 14:00:00
```

#### Database Models

**MatchLogger**:
```typescript
{
  guildId: string,
  active: boolean,
  loggerChannelId: string,
  logData: ObjectId[]
}
```

**MatchLog**:
```typescript
{
  matchId: string,
  region: string,
  logType: string,
  noOfPlayers: number,
  time: Date,
  log: string,
  loggerId: ObjectId
}
```

### Ticket System Module

Automated ticket creation and management system.

#### Commands

| Command | Description |
|---------|-------------|
| `/ticket-activate` | Activate ticket system |
| `/ticket-deactivate` | Deactivate ticket system |
| `/ticket-configure` | Configure ticket system |

#### Features

- **Automatic Ticket Creation**: Creates ticket when users join
- **Category Organization**: Organizes tickets by category
- **Button Interactions**: Close, reopen, delete, transcript buttons
- **Multi-Channel Support**: Separate channels for tickets and transcripts
- **Auto-Configuration**: Automatic setup of channels and categories
- **Manual Configuration**: Full control over setup

#### Setup Process

**Auto-Configure (Recommended)**:
```
1. Use /ticket-activate
2. Click "Auto-Configure" button
3. System creates categories and channels automatically
```

**Manual Configure**:
```
1. Create categories for tickets and transcripts
2. Use /ticket-configure
3. Select channels via interface
```

#### Ticket States

| State | Description |
|-------|-------------|
| `open` | Ticket is active |
| `closed` | Ticket is closed but can be reopened |
| `deleted` | Ticket is permanently deleted |

#### Button Interactions

| Button | Action |
|--------|--------|
| `close_ticket` | Initiates close confirmation |
| `confirm_close` | Closes the ticket |
| `cancel_close` | Cancels close action |
| `reopen_ticket` | Reopens a closed ticket |
| `delete_ticket` | Deletes the ticket |
| `transcript_ticket` | Generates and sends transcript |

#### Database Models

**TicketConfig**:
```typescript
{
  guildId: string,
  active: boolean,
  ticketChannelId?: string,
  transcriptChannelId?: string
}
```

### GAC Integration

The GAC (Game Account Credentials) system integrates with Discord through the web application, allowing administrators to securely send player credentials to Discord channels.

#### Overview

GAC credentials are managed through the web dashboard at `/dashboard/gac` and can be sent to configured Discord channels via server actions. This integration provides:

- **Secure Credential Distribution**: Send GAC usernames/passwords to private Discord channels
- **Team-Based Organization**: Credentials organized by team with proper formatting
- **Discord Embed Format**: Beautiful embeds with credential information
- **Bulk or Individual**: Send all teams or specific teams' credentials

#### How It Works

1. **Store Credentials**: GAC data is stored in MongoDB Player documents
2. **Web Interface**: Manage credentials through `/dashboard/gac`
3. **Discord Integration**: Use "Send to Discord" button from web interface
4. **REST API**: Server actions use Discord REST API to send embeds

#### Server Actions

Located in `src/server/actions/gac.ts`:

```typescript
// Send all teams' GAC to Discord
await sendGACToDiscord(stageId, teamIds?)

// Send single team's GAC to Discord
await sendSingleTeamGACToDiscord(teamId)
```

#### Discord Embed Format

When credentials are sent, they appear as formatted embeds:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GAC Credentials for [Team Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#1 - Player In-Game Name
UID: 123456789
Username: gac_username
Password: gac_password

#2 - Another Player
UID: 987654321
Username: another_username
Password: another_password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Use responsibly. Do not share publicly.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Configuration

**Stage Configuration**:
Each stage can have a Discord channel configured for GAC distribution:

```typescript
// Stage model
{
  guild: {
    guildId: string,
    guildName: string,
    resultChannel: string  // Channel where GAC is sent
  }
}
```

#### Setup Process

1. **Configure Discord Channel**:
   - Go to `/settings/events` in the web app
   - Select the stage
   - Set the result channel

2. **Add GAC Credentials**:
   - Navigate to `/dashboard/gac`
   - Add credentials individually or bulk import
   - Ensure players have GAC username, password, and in-game name

3. **Send to Discord**:
   - Click "Send All to Discord" for all teams
   - Or use "Send to Discord" on individual teams

#### Features

- **Per-Stage Configuration**: Each stage can have different result channels
- **Team Filtering**: Send specific teams' credentials only
- **Player Sorting**: Credentials sorted by UID
- **In-Game Names**: Displays player's in-game name if available
- **Security Warning**: Embed includes footer with security warning

#### Database Models

**Player** (includes GAC fields):
```typescript
{
  name: string,
  uid: string,
  email?: string,
  gacUsername?: string,
  gacPassword?: string,
  gacIngameName?: string,
  team: ObjectId
}
```

**Stage** (includes Discord configuration):
```typescript
{
  name: string,
  eventId: ObjectId,
  guild: {
    guildId: string,
    guildName: string,
    resultChannel?: string  // GAC destination
  }
}
```

#### Security Considerations

1. **Private Channels Only**: Always send to private, secure channels
2. **Access Control**: Limit channel access to authorized personnel only
3. **Temporary Display**: Consider deleting messages after use
4. **Audit Logs**: Discord provides audit logs for message deletion
5. **Secure Storage**: Passwords stored in MongoDB (consider encryption for production)

#### API Integration

The GAC system uses Discord's REST API directly from server actions:

```typescript
// From gac.ts
async function sendDiscordEmbed(
  channelId: string,
  embed: DiscordEmbed
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.DISCORD_TOKEN;
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ embeds: [embed] })
    }
  );
  return { success: response.ok };
}
```

## Help System

The bot provides contextual help for all modules:

```
@DOT help              # General help
@DOT help role_manager # Role Manager help
@DOT help match_logs   # Match Logger help
@DOT help ticket_tool  # Ticket System help
```

Each help command displays an embedded message with:
- Available commands
- Command parameters
- Usage examples
- Permission requirements

## Error Handling

The bot implements comprehensive error handling:

### Client-Level Errors

```typescript
client.on('error', (error) => {
  logger.error('Discord client encountered an error:', error);
});
```

### Process-Level Errors

```typescript
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  client.destroy();
  process.exit(1);
});
```

### Interaction Errors

All interaction handlers include try-catch blocks:
```typescript
try {
  await handler(interaction);
} catch (error) {
  logger.error(`Interaction handler error: ${error}`);
  if (!interaction.replied) {
    await interaction.reply({
      content: '❌ An error occurred',
      flags: MessageFlags.Ephemeral
    });
  }
}
```

## Best Practices

### For Bot Administrators

1. **Use Auto-Configuration**: Let the system set up channels automatically
2. **Test in Development**: Test all commands in a dev server first
3. **Monitor Logs**: Check logs regularly for errors
4. **Backup Data**: Regular database backups recommended
5. **Update Gradually**: Activate modules one at a time

### For Module Usage

**Role Manager**:
- Pre-verify emails before adding users
- Use descriptive role names
- Set appropriate team tags

**Match Logger**:
- Create dedicated channels for logs
- Use consistent naming conventions
- Monitor channel capacity

**Ticket System**:
- Create category structure before activation
- Set up transcript channel for archives
- Configure appropriate permissions

**GAC Integration**:
- Use private channels only for credentials
- Set up dedicated result channels per stage
- Configure channel permissions carefully
- Consider deleting credential messages after use

### Security Considerations

1. **Environment Variables**: Never commit tokens to version control
2. **OTP Security**: 3-attempt limit prevents brute force
3. **Admin Verification**: Only admins can manage tickets
4. **Channel Permissions**: Set proper permissions for ticket channels

## Troubleshooting

### Common Issues

**Commands not appearing**:
```
Solution: Use @DOT register <module> to re-register commands
```

**Bot not responding**:
```
Solution: Check bot has proper intents and permissions
```

**Email not sending**:
```
Solution: Verify SendGrid API key is valid and has credits
```

**Tickets not creating**:
```
Solution: Ensure ticket system is activated and configured
```

### Debug Mode

Enable detailed logging by setting:
```env
LOG_LEVEL=debug
```

## Development

### Adding New Modules

1. Create module directory under `src/discord/`
2. Implement command handlers
3. Register commands in `commandManager.ts`
4. Add to module type definitions
5. Update help system

### Testing Commands

Use Discord.js test guilds for command testing:
```typescript
await registerModuleCommands('all', 'test_guild_id');
```

## API Reference

### Discord REST API Wrapper

The bot includes a REST API wrapper in `lib/discordApi.ts`:

```typescript
// Get guild commands
getGuildCommandsRoute(guildId: string)

// Register commands
rest.put(getGuildCommandsRoute(guildId), { body: commands })

// Delete commands
rest.delete(getDeleteGuildCommandRoute(commandId, guildId))
```

### Logging

Uses Winston for structured logging:

```typescript
import { logger } from './logger';

logger.info('Information message');
logger.error('Error message', error);
logger.warn('Warning message');
```
