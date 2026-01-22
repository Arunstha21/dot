# DOT (Discord Operations Tool)

A comprehensive tournament management system designed for esports organizations, specifically built for PUBG Mobile competitions. DOT combines a Next.js web application with a powerful Discord bot to streamline tournament administration, player verification, match logging, and result management.

## Overview

DOT provides a complete solution for managing esports tournaments with features that span both web-based administration and Discord community management. The system handles event scheduling, team management, player verification, match result tracking, and automated Discord integration.

### Key Features

- **Tournament Management**: Create and manage events, stages, groups, and match schedules
- **Team & Player Management**: Comprehensive team roster management with GAC (Game Account Credentials) support
- **Discord Integration**: Deep Discord integration with role-based verification, ticket system, and match logging
- **Email Automation**: SendGrid-powered email system for player verification and notifications
- **Real-time Results**: Live match result tracking and publishing to Discord channels
- **Import/Export**: Excel and CSV support for bulk data management

## Architecture

DOT consists of two main components:

### Web Application
- Built with **Next.js 16** and **React 19**
- TypeScript for type safety
- MongoDB with Mongoose for data persistence
- NextAuth.js for authentication
- Tailwind CSS with Radix UI components

### Discord Bot
- Built with **Discord.js 14**
- Modular system with three main modules:
  - **Role Manager**: Email-based player verification with automatic role assignment
  - **Match Logger**: Match data logging with formatted embeds
  - **Ticket System**: Automated ticket creation and management

## Project Structure

```
dot/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/       # Dashboard pages (layout and views)
│   │   ├── api/               # API routes
│   │   ├── results/           # Public results pages
│   │   └── settings/          # Settings pages
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── discord/           # Discord-related components
│   │   ├── shared/            # Shared components
│   │   └── ui/                # UI component library (Radix UI)
│   ├── contexts/              # React context providers
│   ├── discord/               # Discord bot implementation
│   │   ├── role-manager/      # Role manager module
│   │   ├── matchLogs/         # Match logger module
│   │   ├── ticket-tool/       # Ticket system module
│   │   └── lib/               # Discord API utilities
│   ├── lib/                   # Utility libraries
│   │   └── database/          # MongoDB models and schemas
│   └── server/                # Server-side logic
│       ├── actions/           # Server actions
│       └── auth.ts            # Authentication configuration
├── public/                    # Static assets
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Discord Bot Token
- SendGrid API Key (for email functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Discord Bot
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_TOKEN=your_discord_bot_token

# MongoDB
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# SendGrid (for email verification)
SENDGRID_API_KEY=your_sendgrid_api_key

# NextAuth
NEXTAUTH_SECRET=your_secret_key_here
```

4. Build the project:
```bash
npm run build
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_CLIENT_ID` | Discord application client ID | Yes |
| `DISCORD_TOKEN` | Discord bot token | Yes |
| `MONGO_URL` | MongoDB connection string | Yes |
| `SENDGRID_API_KEY` | SendGrid API key for emails | Yes* |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Yes |

*Required for Role Manager email verification functionality

## Database Schema

DOT uses MongoDB with the following main collections:

### Tournament Collections
- **EventDB**: Tournament events
- **Stage**: Stages within events
- **Group**: Groups within stages
- **Schedule**: Match schedules
- **Team**: Team information
- **Player**: Player details and GAC credentials
- **PointSystem**: Scoring systems

### Discord Collections
- **Guild**: Discord server configurations
- **RoleManagerUser**: User verification data
- **MatchLogger**: Match logger configurations
- **MatchLog**: Match log entries
- **TicketConfig**: Ticket system settings
- **TicketDocument**: Ticket transcripts

### User Collections
- **User**: Admin user accounts

## Discord Bot Modules

### Role Manager Module

Handles player verification through email-based OTP system.

**Commands:**
- `/email <email>` - Initiates email verification
- `/verify <otp>` - Verifies with OTP code
- `/close` - Closes ticket channels (admin only)

**Features:**
- Email OTP verification with SendGrid
- Automatic role assignment upon verification
- Team tag in nicknames (e.g., "TAG | PlayerName")
- 3-attempt OTP limit
- Admin-only ticket management

### Match Logger Module

Logs match data with formatted Discord embeds.

**Commands:**
- `/log <match_id> <region> <log_type> <no_of_players> <time> <log>` - Logs match data
- `/activate <logger_channel>` - Activates logger for a channel
- `/deactivate` - Deactivates logger

**Features:**
- Stores match logs in MongoDB
- Sends formatted embeds to designated channels
- Per-guild configuration

### Ticket System Module

Automated ticket creation and management.

**Features:**
- Automatic ticket creation on user join
- Category-based organization
- Button interactions (close, reopen, delete, transcript)
- Multi-channel support (tickets and transcripts)

## Web Application Features

### Dashboard

The dashboard provides a central hub for tournament management with dynamic routing based on event/stage/group selection.

**Views:**
- `compose-new` - Create new event emails
- `compose-event` - Template-based emails
- `import-data` - Import Excel/CSV data
- `events` - Event management
- `teams` - Team management
- `matches` - Match management
- `discord` - Discord integration setup
- `role-manager` - Role manager configuration
- `gac` - Game Account Manager
- `results` - Results display and management

### GAC (Game Account Manager)

Comprehensive system for managing game account credentials:

**Features:**
- Store GAC usernames, passwords, and in-game names
- Bulk import/export from CSV
- Send credentials to Discord channels
- Copy credentials to clipboard
- Team-based organization

### Role Manager

Web-based interface for Discord role management:

**Features:**
- View player verification status
- Bulk role reassignment
- Email updates
- Manual verification
- Player statistics

### Results System

Public-facing results pages with:
- Event/stage/group hierarchy
- Match schedule display
- Live results
- Discord integration for publishing

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth authentication

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `PUT /api/events` - Update event
- `DELETE /api/events` - Delete event

### Match Data
- `GET /api/matchdata` - Get match data
- `POST /api/matchdata` - Upload match data

### Other
- `GET /api/highlights` - Get highlights
- `GET /api/stages` - Get stages
- `GET /api/logs` - Get logs
- `GET /api/health` - Health check

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Enable bot and copy token
4. Get client ID from OAuth2 > General

### 2. Configure Bot Permissions

Required permissions:
- Guild Members
- Guild Messages
- Manage Roles
- Manage Channels
- Manage Nicknames
- Send Messages
- Embed Links

### 3. Invite Bot to Server

Use this URL template (replace `CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 4. Register Commands

After the bot is online and in your server, use these commands in Discord:

```
@DOT register all
```

This registers all commands for the bot. You can also register individual modules:
```
@DOT register role_manager
@DOT register match_logs
@DOT register ticket_tool
```

### 5. Configure Modules

Each module needs to be activated per guild:

**Role Manager:**
1. Set up guild in web dashboard
2. Add players and emails
3. Activate through web dashboard or Discord command

**Match Logger:**
1. Use `/activate <logger_channel>` in Discord
2. Logs will be sent to that channel

**Ticket System:**
1. Use `/ticket-activate` command
2. Follow auto-configure or manual setup

## Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### Environment Setup for Production

1. Set `NODE_ENV=production`
2. Ensure all environment variables are set
3. Configure MongoDB connection for production
4. Set up proper logging

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- TipTap (rich text editor)

### Backend
- Node.js
- MongoDB
- Mongoose
- NextAuth.js
- Discord.js
- SendGrid
- Winston (logging)

### Development
- ESLint
- Nodemon
- ts-node

## Roadmap

- [ ] Mobile-responsive improvements
- [ ] Additional game support beyond PUBG Mobile
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API rate limiting improvements
- [ ] Enhanced security features
