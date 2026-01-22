# DOT Web Application Documentation

The DOT web application provides a comprehensive dashboard for managing esports tournaments, teams, players, and Discord integration.

## Table of Contents

- [Architecture](#architecture)
- [Authentication](#authentication)
- [Dashboard Overview](#dashboard-overview)
- [Features](#features)
- [Server Actions](#server-actions)
- [API Routes](#api-routes)
- [Database Models](#database-models)

## Architecture

### Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: TipTap editor
- **State**: React Context API
- **Database**: MongoDB with Mongoose
- **Auth**: NextAuth.js v4

### Project Structure

```
src/
├── app/
│   ├── (dashboard)/           # Dashboard pages
│   │   ├── layout.tsx        # Dashboard layout wrapper
│   │   └── [view]/           # Dynamic view routing
│   ├── results/              # Public results pages
│   ├── settings/             # Settings pages
│   └── api/                  # API routes
├── components/
│   ├── dashboard/            # Dashboard components
│   ├── shared/               # Shared components
│   └── ui/                   # UI component library
├── contexts/                 # React contexts
├── lib/
│   └── database/             # Database models
└── server/
    ├── actions/              # Server actions
    └── auth.ts               # Auth configuration
```

## Authentication

### NextAuth.js Configuration

DOT uses NextAuth.js with a custom credentials provider:

```typescript
// src/server/auth.ts
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Custom authorization logic
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback
    },
    async session({ session, token }) {
      // Session callback
    }
  }
}
```

### User Model

```typescript
{
  username: string,
  password: string, // bcrypt hashed
  superUser: boolean,
  events: ObjectId[]
}
```

### Protected Routes

Server components check authentication:

```typescript
const session = await getServerSession(authConfig);
if (!session?.user?.superUser) {
  redirect('/login');
}
```

## Dashboard Overview

### Layout Structure

The dashboard uses a persistent layout with:
- **Sidebar Navigation**: Quick access to all views
- **Header**: User profile and context switcher
- **Main Content**: Dynamic view rendering
- **Event/Stage/Group Selector**: Context-aware data filtering

### Dynamic Routing

Dashboard uses dynamic routing based on view parameter:

```
/dashboard/[view]
```

Available views:
- `compose-new` - Create new emails
- `compose-event` - Template-based emails
- `import-data` - Import Excel/CSV
- `events` - Event management
- `teams` - Team management
- `matches` - Match management
- `discord` - Discord setup
- `role-manager` - Role manager config
- `gac` - GAC management
- `results` - Results display

### Event Context Selection

Many views require selecting event hierarchy:

```
Event → Stage → Group
```

This context filters data and determines which operations are available.

## Features

### Event Management

**Location**: `/dashboard/events` and `/settings/events`

**Features**:
- Create/edit/delete events
- Add stages to events
- Add groups to stages
- Configure point systems
- Set event visibility (public/private)

**Server Actions**:
```typescript
createEventAction(formData)
addStageAction(formData)
addGroupAction(formData)
updateEventAction(formData)
deleteEventAction(formData)
```

### Team Management

**Location**: `/dashboard/teams`

**Features**:
- Create/edit/delete teams
- Manage team rosters
- Assign players to teams
- Set team tags and logos
- Import teams from CSV

**Database Model**:
```typescript
{
  name: string,
  tag: string,
  logo?: string,
  group: ObjectId,
  players: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}
```

### GAC (Game Account Credentials)

**Location**: `/dashboard/gac`

**Features**:
- Store GAC credentials per player
- Bulk import from CSV
- Export to CSV
- Send to Discord channels
- Copy to clipboard
- Password visibility toggle

**Server Actions**:
```typescript
updatePlayerGAC(playerId, data)
bulkImportGAC(stageId, data)
exportTeamGAC(teamId)
sendGACToDiscord(stageId, teamIds?)
copyPlayerGAC(playerId)
```

**CSV Format**:
```csv
Player Name,UID,GAC Username,GAC Password,In-Game Name
Player One,123456,username1,password1,IGN1
Player Two,234567,username2,password2,IGN2
```

### Role Manager

**Location**: `/dashboard/role-manager`

**Features**:
- View verification status
- Bulk role reassignment
- Update player emails
- Manual verification
- Resend OTP emails
- Player statistics

**Statistics Tracked**:
- Total players
- Verified players
- Unverified players
- Pending verification
- Joined server

### Email Composition

**Locations**:
- `/dashboard/compose-new` - Custom emails
- `/dashboard/compose-event` - Template emails

**Features**:
- Rich text editor (TipTap)
- Recipient selection
- Subject and sender configuration
- Preview mode
- SendGrid integration

**Components**:
- `RichEditor` - TipTap-based editor
- `RecipientsField` - Multi-email input
- `SubjectField` - Subject input
- `SenderSelect` - Sender selection

### Data Import

**Location**: `/dashboard/import-data`

**Features**:
- Excel file upload (.xlsx)
- CSV file upload
- Column mapping interface
- Data validation
- Bulk operations

**Supported Formats**:
- Excel (.xlsx)
- CSV (.csv)

### Results System

**Location**: `/results` (public)

**Features**:
- Public event results
- Match schedule display
- Standings tables
- Discord integration
- Live updates

## Server Actions

DOT uses Next.js Server Actions for data mutations:

```typescript
"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/server/auth"
import { dbConnect } from "@/lib/db"

async function ensureAdmin() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.superUser) {
    return { status: "error", message: "Forbidden" };
  }
  await dbConnect();
  return null;
}

export async function myAction(prev: ActionResult, formData: FormData) {
  const guard = await ensureAdmin();
  if (guard) return guard;

  // Action logic
}
```

### Available Actions

**Events** (`events-actions.ts`):
- `createEventAction`
- `addStageAction`
- `addGroupAction`
- `updateEventAction`
- `deleteEventAction`

**GAC** (`gac.ts`):
- `getTeamsWithGAC`
- `updatePlayerGAC`
- `deletePlayerGAC`
- `bulkImportGAC`
- `exportTeamGAC`
- `sendGACToDiscord`

**Role Manager** (`roleManager.ts`):
- `getRoleManagerPlayers`
- `getRoleManagerStats`
- `reassignPlayerRoles`
- `updatePlayerEmail`
- `addPlayerToRoleManager`
- `removePlayerFromRoleManager`

**Discord** (`discord-actions.ts`):
- `getAllGuilds`
- `saveDiscordSettings`
- `testDiscordConnection`

## API Routes

### Authentication

```
POST /api/auth/[...nextauth]
```
Handles NextAuth authentication flow.

### Events

```
GET  /api/events           # List events
POST /api/events           # Create event
PUT  /api/events/:id       # Update event
DELETE /api/events/:id     # Delete event
```

### Match Data

```
GET  /api/matchdata        # Get match data
POST /api/matchdata        # Upload match data
```

### Stages

```
GET  /api/stages           # List stages
POST /api/stages           # Create stage
```

### Other

```
GET /api/highlights        # Get highlights
GET /api/logs              # Get logs
GET /api/health            # Health check
```

## Database Models

### EventDB

```typescript
{
  name: string,
  organizer?: string,
  discordLink?: string,
  isPublic?: boolean,
  pointSystem?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Stage

```typescript
{
  eventId: ObjectId,
  name: string,
  guild?: ObjectId,
  resultChannel?: string,
  groups: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}
```

### Group

```typescript
{
  stageId: ObjectId,
  name: string,
  data: any[],
  schedules: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}
```

### Team

```typescript
{
  name: string,
  tag: string,
  logo?: string,
  group: ObjectId,
  players: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}
```

### Player

```typescript
{
  name: string,
  uid: string,
  email?: string,
  gacUsername?: string,
  gacPassword?: string,
  gacIngameName?: string,
  team: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Schedule

```typescript
{
  groupId: ObjectId,
  eventId: ObjectId,
  matchNo: number,
  overallMatchNo: number,
  map: string,
  date: Date,
  startTime: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Guild (Discord)

```typescript
{
  guildId: string,
  guildName: string,
  roleManager: boolean,
  matchLogger: ObjectId,
  ticketConfig: ObjectId,
  users: ObjectId[],
  admins: ObjectId[]
}
```

### RoleManagerUser

```typescript
{
  userName: string,
  email: string,
  role: string[],
  otp?: number,
  emailSent: number,
  serverJoined: boolean,
  sender?: string,
  guild: ObjectId,
  team?: ObjectId,
  player?: ObjectId
}
```

## Components

### UI Components

Located in `src/components/ui/`, built with Radix UI:

- `Button` - Button component
- `Input` - Text input
- `Label` - Form label
- `Dialog` - Modal dialogs
- `Table` - Data tables
- `Tabs` - Tab navigation
- `Select` - Dropdown select
- `Switch` - Toggle switch
- `Tooltip` - Hover tooltips

### Dashboard Components

Located in `src/components/dashboard/`:

**GAC**:
- `GACPage` - Main GAC management
- `GACEditDialog` - Edit player credentials
- `GACBulkImport` - Bulk import dialog
- `GACBulkEditDialog` - Bulk edit dialog

**Role Manager**:
- `RoleManagerPage` - Main role manager
- `RoleManagerStats` - Statistics display
- `PlayerTable` - Player list table

**Email**:
- `RichEditor` - TipTap rich text editor
- `RecipientsField` - Multi-email input
- `MessagePreview` - Email preview

**Discord**:
- `DiscordServerCard` - Server status card
- `DiscordManagement` - Discord settings

### Shared Components

Located in `src/components/shared/`:

- `DiscordServerCard` - Server connection status
- `LoadingSpinner` - Loading indicator
- `EmptyState` - Empty state display

## Context Providers

### EventContext

Manages current event, stage, and group selection:

```typescript
interface EventContextValue {
  event: EventDB | null;
  stage: Stage | null;
  group: Group | null;
  setEvent: (event: EventDB) => void;
  setStage: (stage: Stage) => void;
  setGroup: (group: Group) => void;
}
```

## Styling

### Tailwind Configuration

Uses Tailwind CSS v4 with custom configuration:

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // ... more colors
      }
    }
  }
}
```

### Dark Mode

Uses `next-themes` for theme switching:

```typescript
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="dark">
  {children}
</ThemeProvider>
```

## Best Practices

### Server Actions

1. Always check admin permissions first
2. Use `revalidatePath` after mutations
3. Return consistent `ActionResult` type
4. Handle errors gracefully

### Client Components

1. Minimize client components when possible
2. Use server components by default
3. Pass functions from server actions to clients
4. Use `useTransition` for optimistic updates

### Database

1. Always use `dbConnect()` before operations
2. Use `populate()` for referenced documents
3. Create indexes for frequently queried fields
4. Use transactions for multi-document operations

## Error Handling

### Server Actions

```typescript
export async function myAction(): Promise<ActionResult> {
  try {
    // Action logic
    return { status: "success", message: "Success" };
  } catch (error) {
    console.error("Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
```

### Client Components

```typescript
import { toast } from "sonner";

const result = await myAction();
if (result.status === "success") {
  toast.success(result.message);
} else {
  toast.error(result.message);
}
```

## Performance Optimization

1. **Server Components**: Use by default for better performance
2. **Dynamic Imports**: Code split large components
3. **Image Optimization**: Use Next.js Image component
4. **Database Indexing**: Index frequently queried fields
5. **Caching**: Use React caching for expensive operations

## Security Considerations

1. **Admin Verification**: Always check `superUser` flag
2. **Input Validation**: Use Zod schemas for all inputs
3. **SQL Injection**: Use Mongoose (prevents NoSQL injection)
4. **XSS Prevention**: React escapes by default
5. **CSRF Protection**: NextAuth handles this
6. **Password Hashing**: Use bcrypt for passwords
