# CCAnalysis CLI

CLI tool for managing the CCAnalysis database that tracks Claude Code sessions.

## Installation

The CLI is initialized with Bun and uses Drizzle ORM with SQLite for database management.

```bash
cd cli
bun install
```

## Database Location

The database is stored at `~/.ccanalysis/data.sqlite` in your home directory.

## Commands

### Initialize Database

Create the database and run migrations:

```bash
bun index.ts init
```

Or using the npm script:

```bash
bun run init
```

### Check Status

View database statistics and table counts:

```bash
bun index.ts status
```

Or:

```bash
bun run status
```

### List Sessions

View the 10 most recent sessions:

```bash
bun index.ts sessions
```

Or:

```bash
bun run sessions
```

### Help

Display available commands:

```bash
bun index.ts help
```

## Database Schema

The database tracks the following entities:

- **Sessions**: Individual Claude Code sessions with metadata
- **Tool Calls**: Individual tool invocations with timing and token data
- **User Prompts**: User inputs and interruptions
- **Agent Calls**: Sub-agent spawning and lifecycle
- **Model Responses**: Claude's responses with token usage
- **Events**: General lifecycle events

## Development

### Schema Changes

1. Modify `schema.ts`
2. Generate migrations: `bunx drizzle-kit generate`
3. Apply migrations: `bun index.ts init`

### Database Inspection

Use Drizzle Studio to inspect the database:

```bash
bunx drizzle-kit studio
```

## Project Structure

```
cli/
├── index.ts           # CLI entry point
├── db.ts              # Database initialization
├── schema.ts          # Database schema
├── drizzle.config.ts  # Drizzle configuration
├── drizzle/           # Migration files
└── package.json       # Dependencies
```

This project uses [Bun](https://bun.com) as its JavaScript runtime.
