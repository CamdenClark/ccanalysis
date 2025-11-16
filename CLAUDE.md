# CCAnalysis

A Claude Code plugin for tracking and analyzing Claude Code sessions.

## Project Overview

CCAnalysis helps developers understand their Claude Code usage patterns by tracking the full trajectory of sessions including tool calls, user prompts, agent calls, and more. All data is stored in a local SQLite database for analysis.

## Analysis Goals

The plugin enables the following types of analysis:

- **Performance**: What tool calls are taking the longest?
- **Token Usage**: What tool calls are using the most tokens?
- **User Interruptions**: Where is the user having to interrupt, and how can we give better guidance to Claude to reduce interruptions?

## Architecture

### Core Components

1. **Tracker Plugin** (`tracker/`)
   - Implements hooks to track all Claude Code messages
   - Captures tool calls, prompts, responses, and lifecycle events
   - Writes tracking data to SQLite database

2. **Analysis Plugin** (`analysis/`)
   - Provides commands for analyzing collected data
   - May include sub-agents for complex analysis tasks
   - Skills for common analysis patterns
   - Query interfaces for exploring session data

3. **CLI** (`cli/`)
   - Core tracking hooks that inject into Claude Code lifecycle
   - Project and session management
   - Database initialization and maintenance

## Technical Considerations

### Project Tracking
- How do we identify and track different projects?
- How do we recognize git worktrees as part of the same project?
- Should we use repository URL, working directory, or both?

### Sub-Agent Tracking
- How do we track sub-agents spawned during a session?
- How do we associate sub-agent actions with the parent session?
- Should we track the full sub-agent trajectory or just summarize?

### Data Schema
- Session metadata (timestamp, project, duration)
- Tool call records (type, duration, tokens, success/failure)
- User prompts and interruptions
- Agent spawning and lifecycle events

## Claude Code Plugin System

### Plugin Structure

Claude Code plugins follow a standard directory structure:

```
plugin-name/
├── .claude-plugin/plugin.json    # Required: Plugin metadata (name, description, version, author)
├── commands/                      # Optional: Custom slash commands (markdown files)
├── agents/                        # Optional: Agent definitions
├── skills/                        # Optional: Agent Skills (subdirectories with SKILL.md)
└── hooks/                         # Optional: Event handlers (hooks.json)
```

### Plugin Components

1. **Plugin Manifest** (`.claude-plugin/plugin.json`)
   - Required metadata file for Claude Code to recognize the plugin
   - Contains name, description, version, and author information

2. **Commands** (`commands/`)
   - Markdown files defining custom slash commands
   - Appear in `/help` after plugin installation
   - Invoked via `/command-name` syntax

3. **Agents** (`agents/`)
   - Custom agent definitions for specialized tasks
   - Can be invoked by users or other agents

4. **Skills** (`skills/`)
   - Model-invoked capabilities
   - Organized in subdirectories with `SKILL.md` files
   - Provide domain-specific knowledge to agents

5. **Hooks** (`hooks/hooks.json`)
   - Event handlers for workflow automation
   - Listen to Claude Code lifecycle events
   - Enable automatic tracking without manual invocation
   - **Critical for CCAnalysis tracker functionality**

### Development Workflow

1. **Local Development**
   - Create plugin components in appropriate directories
   - Set up local marketplace with `.claude-plugin/marketplace.json`
   - Install via `/plugin install plugin-name`
   - Requires restart to activate changes

2. **Testing**
   - Verify commands appear in `/help`
   - Test functionality through interactive menu or direct invocation
   - Uninstall and reinstall after modifications

3. **Team Deployment**
   - Configure in `.claude/settings.json` for repository-level provisioning
   - Automatically provisions plugins when team members trust the repository

### Hooks for CCAnalysis

The tracker plugin will primarily use hooks to:
- Capture tool call events (start, end, duration, tokens)
- Track user prompts and responses
- Monitor agent spawning and lifecycle
- Record interruptions and errors
- Write tracking data to SQLite database

Hooks provide the event-driven architecture needed for passive session tracking without requiring user intervention.

## Installation

See [INSTALL.md](./INSTALL.md) for complete installation instructions.

**Quick start:**

1. Initialize database: `cd cli && bun install && bun index.ts init`
2. Install tracker deps: `cd tracker && bun install`
3. In Claude Code: `/plugin marketplace add /path/to/ccanalysis`
4. In Claude Code: `/plugin install ccanalysis-tracker@ccanalysis-dev`
5. Restart Claude Code

## Development Guidelines

- Use Bun for all JavaScript/TypeScript execution
- Use `bun:sqlite` for database operations
- Follow the Bun patterns outlined in the root CLAUDE.md
- Keep tracker hooks lightweight to minimize performance impact
- Design analysis commands to be composable and reusable
- Test plugins locally before distribution
- Restart Claude Code after plugin installation/updates
