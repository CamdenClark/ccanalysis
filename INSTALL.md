# CCAnalysis Installation Guide

Follow these steps to install and activate the CCAnalysis tracker plugin.

## Prerequisites

1. **Initialize the CLI and Link it Globally**

   First, set up the SQLite database and make the CLI available via `bunx`:

   ```bash
   cd cli
   bun install
   bun index.ts init
   bun link
   ```

   This:
   - Creates `~/.ccanalysis/data.sqlite` with all necessary tables
   - Links the CLI globally so `bunx ccanalysis` works from anywhere

2. **Verify CLI is Working**

   ```bash
   bunx ccanalysis help
   ```

   You should see the CCAnalysis CLI help menu.

## Installing the Plugin

### Step 1: Add the Local Marketplace

From **within Claude Code**, navigate to the ccanalysis directory and add the local marketplace:

```
/plugin marketplace add /Users/camdenclark/ccanalysis
```

Replace the path with the absolute path to your ccanalysis directory.

### Step 2: Install the Tracker Plugin

Still in Claude Code, install the plugin:

```
/plugin install ccanalysis-tracker@ccanalysis-dev
```

### Step 3: Restart Claude Code

For the hooks to activate, you must restart Claude Code completely:

1. Quit Claude Code
2. Relaunch Claude Code

## Verifying Installation

After restarting, verify the plugin is working:

1. **Check the database is receiving data:**

   ```bash
   cd cli
   bun index.ts status
   ```

   You should see sessions, tool calls, and user prompts being tracked.

2. **View recent sessions:**

   ```bash
   bun index.ts sessions
   ```

## Updating the Plugin

When you make changes to the tracker code:

1. **Uninstall the plugin** (in Claude Code):
   ```
   /plugin uninstall ccanalysis-tracker@ccanalysis-dev
   ```

2. **Reinstall the plugin:**
   ```
   /plugin install ccanalysis-tracker@ccanalysis-dev
   ```

3. **Restart Claude Code** to activate changes

## Troubleshooting

### Plugin not found

- Ensure you're using the absolute path when adding the marketplace
- Check that `.claude-plugin/marketplace.json` exists in the ccanalysis directory

### Hooks not firing

- Make sure you restarted Claude Code after installation
- Verify hook scripts are executable: `chmod +x tracker/hooks/*.sh`
- Check CLI is linked: `bunx ccanalysis help`
- Check database: `bunx ccanalysis status`

### CLI not found errors

- Link the CLI globally: `cd cli && bun link`
- Verify: `bunx ccanalysis help`

### Database errors

- Reinitialize database: `bunx ccanalysis init`
- Check permissions on `~/.ccanalysis/` directory

### No data appearing

- The hooks only track NEW sessions after installation
- Try submitting a prompt or using a tool, then check: `bunx ccanalysis status`

## Uninstalling

To completely remove the plugin:

1. **Uninstall from Claude Code:**
   ```
   /plugin uninstall ccanalysis-tracker@ccanalysis-dev
   ```

2. **Remove marketplace (optional):**
   ```
   /plugin marketplace remove ccanalysis-dev
   ```

3. **Delete database (optional):**
   ```bash
   rm -rf ~/.ccanalysis
   ```

## Architecture

The CCAnalysis tracker uses a **thin wrapper architecture**:

- **CLI** (`cli/`): Contains all the database logic, schema, and tracking commands
  - TypeScript + Bun + Drizzle ORM
  - Linked globally via `bun link` to enable `bunx ccanalysis`

- **Tracker Plugin** (`tracker/`): Simple bash hooks that forward events to CLI
  - No dependencies, no TypeScript
  - Just 3 bash scripts that call `bunx ccanalysis <command>`
  - Runs tracking in background (non-blocking)

## Directory Structure

After installation, your structure should look like:

```
ccanalysis/
├── .claude-plugin/
│   └── marketplace.json          # Local marketplace config
├── cli/
│   ├── schema.ts                 # Database schema
│   ├── db.ts                     # Database utilities
│   ├── index.ts                  # CLI commands (includes tracking)
│   ├── drizzle/                  # Migrations
│   └── package.json              # CLI dependencies
└── tracker/
    ├── .claude-plugin/
    │   └── plugin.json           # Plugin metadata
    ├── hooks/
    │   ├── hooks.json            # Hook configuration
    │   ├── preToolUse.sh         # Pre-tool hook (bash)
    │   ├── userPromptSubmit.sh   # User prompt hook (bash)
    │   └── postToolUse.sh        # Post-tool hook (bash)
    └── README.md
```

**Note:** The tracker has NO dependencies - just simple bash scripts!

## What Gets Tracked

Once installed, the tracker automatically captures:

- **Tool Calls**: Every tool invocation (Read, Write, Edit, Bash, Task, etc.)
  - Tool name and parameters
  - Start time, end time, and duration
  - Success/failure status
  - Results and error messages

- **User Prompts**: Every message you send to Claude
  - Prompt text
  - Timestamp
  - Interruption detection (future feature)

- **Sessions**: Metadata about your coding sessions
  - Project path
  - Start/end times
  - Total tokens used (future feature)

All data is stored locally in `~/.ccanalysis/data.sqlite` - nothing is sent to external servers.
