# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive 2026 FIFA World Cup Draw Simulator built with React, TypeScript, and Vite. Features animated team drawings with confederation-based placement rules and AI-powered analysis via Google's Gemini API.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Database commands
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations to database
npm run db:studio    # Open Drizzle Studio GUI
```

## Environment Setup

Set environment variables in `.env.local`:

```
GEMINI_API_KEY=your_api_key_here
TURSO_DATABASE_URL=your_turso_database_url_here
TURSO_AUTH_TOKEN=your_turso_auth_token_here
```

- `GEMINI_API_KEY`: For AI analysis features (accessed as `process.env.API_KEY` in `services/geminiService.ts`)
- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`: For Turso database connection (used by serverless functions)

### Database Setup

1. Create a Turso database:
   ```bash
   turso db create wc-2026-draws
   ```

2. Get database URL and auth token:
   ```bash
   turso db show wc-2026-draws --url
   turso db tokens create wc-2026-draws
   ```

3. Add credentials to `.env.local`

4. Generate and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

## Architecture

### Core Draw Logic (App.tsx)

The draw simulation enforces FIFA World Cup placement rules:

1. **Host Pre-assignment**: Mexico (Group A), Canada (Group B), USA (Group D) are pre-assigned from Pot 1
2. **Sequential Pot Drawing**: Teams drawn from Pots 1-4 in order
3. **Confederation Constraints**:
   - UEFA teams: Max 2 per group
   - Other confederations: Max 1 per group
4. **Placement Strategy**: Teams fill groups sequentially (A-L), respecting constraints

Key state management:
- `potIndex`: Current pot being drawn (0-3)
- `groups`: 12-group array, each with 4 teams when complete
- `isValidPlacement()`: Validates confederation rules before team placement

### Animation Flow (DrawStage.tsx)

Two-stage animation sequence using Framer Motion:
1. **Ball stage** (600ms): Spinning ball appears
2. **Reveal stage** (2500ms): Ball opens, team displayed, then flies away
3. Triggers `onAnimationComplete()` callback to update groups

### AI Integration (services/geminiService.ts)

Uses `@google/genai` with `gemini-2.5-flash` model:
- `analyzeGroup()`: Per-group commentary (unused in current UI)
- `analyzeFullDraw()`: Full draw analysis identifying Group of Death, easiest group, dark horse

### Data Structure (constants.ts)

- `POT_1` through `POT_4`: Team definitions with confederation metadata
- `MOCK_FLAGS`: Emoji flag mappings for visual display
- `INITIAL_GROUPS`: 12 empty groups (A-L)

### URL Sharing

Completed draws are shareable via database-backed URLs:
- **Share Flow**: `shareDraw()` POSTs group data to `/api/save-draw`, receives unique ID, generates URL with `?id={id}` parameter
- **Load Flow**: On page load, checks for `?id` parameter, fetches draw from `/api/get-draw?id={id}`, restores state
- **Legacy Support**: Still supports old URL hash format (base64-encoded group data) for backwards compatibility
- **Database**: Turso + Drizzle ORM stores draws in `draws` table with unique nanoid (8 chars)
- **Serverless Functions**:
  - `/api/save-draw`: Saves draw data, returns unique ID
  - `/api/get-draw`: Retrieves draw data by ID

### Auto-Draw Mode

When enabled, automatically draws teams every 500ms until draw completes. Managed via `useEffect` hook that triggers `drawNextTeam()` when `isAuto && !isAnimating`.

## Key Files

- `App.tsx`: Main orchestration, draw logic, UI
- `components/DrawStage.tsx`: Team reveal animation
- `components/GroupCard.tsx`: Group display component
- `services/geminiService.ts`: Gemini API integration
- `constants.ts`: Team data, pots, flags
- `types.ts`: TypeScript interfaces
- `db/schema.ts`: Drizzle ORM schema for draws table
- `db/client.ts`: Turso database client configuration
- `api/save-draw.ts`: Serverless function to save draws
- `api/get-draw.ts`: Serverless function to retrieve draws
- `drizzle.config.ts`: Drizzle Kit configuration for migrations
