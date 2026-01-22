# DOT Setup and Deployment Guide

Complete guide for setting up and deploying the DOT (Discord Operations Tool) system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Discord Bot Setup](#discord-bot-setup)
- [SendGrid Configuration](#sendgrid-configuration)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **MongoDB**: Version 6.0 or higher (or MongoDB Atlas account)
- **Git**: For cloning the repository

### Required Accounts

- **Discord Developer Account**: For bot creation
- **MongoDB Atlas Account** (optional): For cloud database
- **SendGrid Account**: For email functionality
- **Git Repository Access**: To clone the project

### Required Hardware

- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dot
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required dependencies including:
- Next.js and React
- Discord.js
- MongoDB drivers
- UI component libraries
- Development tools

### 3. Create Environment File

```bash
cp .env.example .env
```

Or create manually:

```bash
touch .env
```

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Discord Bot Configuration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_TOKEN=your_discord_bot_token

# MongoDB Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/dot

# SendGrid Configuration
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_random_secret_key_at_least_32_chars

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_CLIENT_ID` | Discord application client ID | `1400111894164930640` |
| `DISCORD_TOKEN` | Discord bot token | `MTQwMDExMTg5NDE2NDkzMDY0MA.G...` |
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://user:pass@host/db` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.8sU0Z3pYTMGIR93gA7wL4Q...` |
| `NEXTAUTH_SECRET` | JWT signing secret | `random-32-character-string-here` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

### Generating NEXTAUTH_SECRET

Generate a secure secret:

```bash
# Method 1: Using OpenSSL
openssl rand -base64 32

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Database Setup

### Option 1: MongoDB Atlas (Cloud)

1. **Create Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster**:
   - Click "Build a Database"
   - Select "Free" tier (M0)
   - Choose a region close to you

3. **Configure Security**:
   - Create a database user (username/password)
   - Network Access: Add IP `0.0.0.0/0` (all IPs) for development
   - For production, add specific server IPs only

4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

5. **Update `.env`**:
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/dot?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

1. **Install MongoDB**:
   - macOS: `brew install mongodb-community`
   - Ubuntu: `sudo apt install mongodb`
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)

2. **Start MongoDB**:
   - macOS: `brew services start mongodb-community`
   - Ubuntu: `sudo systemctl start mongod`
   - Windows: Run MongoDB as service

3. **Update `.env`**:
```env
MONGO_URL=mongodb://localhost:27017/dot
```

### Database Initialization

The database is automatically initialized on first run. Collections are created by Mongoose models.

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter application name (e.g., "DOT Bot")
4. Agree to terms and create

### 2. Create Bot User

1. Navigate to "Bot" section
2. Click "Add Bot"
3. Confirm bot creation
4. Copy bot token (needed for `.env`)

### 3. Configure Bot Settings

**Privileged Gateway Intents**:
- Presence Intent
- Server Members Intent
- Message Content Intent

**Bot Permissions** (for invite URL):
- Manage Roles
- Manage Channels
- Manage Nicknames
- Send Messages
- Embed Links
- Read Message History
- Add Reactions
- Use Application Commands

### 4. Get Client ID

1. Navigate to "OAuth2" → "General"
2. Copy "Application ID" (this is your Client ID)

### 5. Invite Bot to Server

Use this URL template:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=268445696&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your actual client ID.

### 6. Register Commands

After the bot is online, use Discord mentions:

```
@DOT register all
```

This registers all slash commands for the bot.

## SendGrid Configuration

### 1. Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day)

### 2. Create API Key

1. Navigate to "Settings" → "API Keys"
2. Click "Create API Key"
3. Name it "DOT Bot"
4. Select permissions: "Mail Send"
5. Copy the API key

### 3. Configure Email Template

The bot sends plain text OTP emails. To customize:

1. Navigate to "Marketing" → "Transactional Templates"
2. Create new template (optional)

### 4. Update `.env`

```env
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

### 5. Verify Sender Email

1. Navigate to "Settings" → "Sender Authentication"
2. Verify your sending domain or email
3. Use verified email in `helper/email.ts`

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts:
- Next.js dev server on `http://localhost:3000`
- Discord bot connects automatically
- Hot reload enabled for both web and bot

### Development Features

- **Hot Reload**: Changes refresh automatically
- **Source Maps**: Full debugging support
- **Verbose Logging**: Detailed console output
- **Error Overlay**: Development-only error display

### Production Build

```bash
npm run build
npm run start
```

This:
- Builds optimized production bundles
- Compiles server code
- Starts production server
- Discord bot connects in production mode

## Production Deployment

### Option 1: Vercel (Recommended for Web App)

**Web Application**:

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Set Environment Variables**:
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add all variables from `.env`

4. **Note**: Discord bot won't work on Vercel (serverless functions don't maintain WebSocket connections)

**Discord Bot** (Separate Server):

Deploy bot on a regular VPS (see Option 2 or 3).

### Option 2: VPS Deployment

**Server Requirements**:
- Ubuntu 20.04+ or similar
- Node.js 18+
- MongoDB (local or Atlas)

**Deployment Steps**:

1. **Connect to Server**:
```bash
ssh user@your-server.com
```

2. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Clone Repository**:
```bash
cd /var/www
git clone <repository-url> dot
cd dot
```

4. **Install Dependencies**:
```bash
npm install
```

5. **Create Environment File**:
```bash
nano .env
# Add production environment variables
```

6. **Build Application**:
```bash
npm run build
```

7. **Setup PM2** (Process Manager):
```bash
sudo npm install -g pm2
```

8. **Start with PM2**:
```bash
pm2 start dist/server.js --name "dot"
pm2 save
pm2 startup
```

9. **Setup Nginx Reverse Proxy**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

10. **Setup SSL** (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker Deployment

**Dockerfile**:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - MONGO_URL=${MONGO_URL}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped

  # Optional: Local MongoDB
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

**Deploy**:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## Monitoring and Maintenance

### Log Management

**PM2 Logs**:
```bash
pm2 logs dot
pm2 logs dot --lines 100
```

**Docker Logs**:
```bash
docker-compose logs -f app
```

### Database Backups

**MongoDB Atlas**: Automatic backups included

**Manual Backup**:
```bash
mongodump --uri="MONGO_URL" --out=/backup/$(date +%Y%m%d)
```

### Updates

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart (PM2)
pm2 restart dot
```

## Troubleshooting

### Discord Bot Not Connecting

**Issue**: Bot shows as offline

**Solutions**:
1. Check token is correct in `.env`
2. Verify bot has required intents
3. Check bot is invited to server
4. Check Discord API status

### Database Connection Errors

**Issue**: `MongooseServerError: connection failed`

**Solutions**:
1. Check MongoDB connection string
2. Verify IP whitelist (Atlas)
3. Check database credentials
4. Ensure MongoDB is running

### Email Not Sending

**Issue**: OTP emails not received

**Solutions**:
1. Verify SendGrid API key
2. Check sender email is verified
3. Verify recipient email is correct
4. Check SendGrid email quota

### Build Errors

**Issue**: `npm run build` fails

**Solutions**:
1. Clear cache: `rm -rf .next node_modules`
2. Reinstall: `npm install`
3. Check Node.js version: `node -v` (should be 18+)
4. Check TypeScript errors

### Port Already in Use

**Issue**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

## Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Setup SSL/HTTPS
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB backups
- [ ] Restrict Discord bot permissions
- [ ] Monitor logs regularly
- [ ] Keep dependencies updated

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review Discord and MongoDB logs
- Contact development team
