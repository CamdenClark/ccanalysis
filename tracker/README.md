# CCAnalysis Tracker Plugin

A Claude Code plugin that automatically tracks session data including tool calls, user prompts, and lifecycle events.

## Overview

This plugin is a **thin wrapper** that uses hooks to forward tracking events to the CCAnalysis CLI via `bunx`. All database logic and tracking implementation lives in the CLI.

The tracker captures data about your coding sessions and stores it in the CCAnalysis database (`~/.ccanalysis/data.sqlite`).

## Architecture

The tracker plugin consists of:
- **1 config file** (`hooks/hooks.json`) - defines hooks that call the CLI
- **No scripts, no TypeScript, no dependencies** - just CLI commands

Each hook:
1. Receives JSON from Claude Code
2. Calls `bunx ccanalysis <command>` with the data
3. Times out after 5 seconds if needed

## Tracked Events

- **Tool Calls**: Every tool invocation with timing, parameters, and results
- **User Prompts**: All user inputs submitted to Claude
- **Session Lifecycle**: Session starts, completions, and errors

## Installation

### Prerequisites

1. **Initialize the CLI and link it globally:**
   ```bash
   cd ../cli
   bun install
   bun index.ts init
   bun link
   ```

   The `bun link` command makes the CLI available as `bunx ccanalysis` globally.

2. **Verify CLI is accessible:**
   ```bash
   bunx ccanalysis help
   ```

### Plugin Installation

See the main [INSTALL.md](../INSTALL.md) for complete installation instructions.

## How It Works

### Hook Configuration

Hooks are configured in `hooks/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "bunx --bun ccanalysis track-tool-start",
        "timeout": 5000
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "bunx --bun ccanalysis track-prompt",
        "timeout": 5000
      }]
    }],
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "bunx --bun ccanalysis track-tool-end",
        "timeout": 5000
      }]
    }]
  }
}
```

### Hooks

1. **PreToolUse**: Tracks when a tool is about to be called
   - Command: `bunx --bun ccanalysis track-tool-start`
   - Receives: `session_id`, `cwd`, `tool_name`, `tool_input`

2. **UserPromptSubmit**: Tracks user input to Claude
   - Command: `bunx --bun ccanalysis track-prompt`
   - Receives: `session_id`, `cwd`, `user_prompt`

3. **PostToolUse**: Tracks tool completion and results
   - Command: `bunx --bun ccanalysis track-tool-end`
   - Receives: `session_id`, `tool_name`, `tool_output`, `success`

## Performance

The tracker is designed to be **extremely lightweight**:
- Hooks call CLI commands directly (no wrapper scripts)
- 5-second timeout ensures hooks never hang
- Errors in tracking never affect Claude Code functionality
- All data processing happens in the CLI

## Troubleshooting

### Hooks not firing
- Ensure plugin is properly installed in Claude Code
- Check CLI is linked: `bunx ccanalysis help`
- Verify database is initialized: `bunx ccanalysis status`

### CLI not found
- Link the CLI: `cd ../cli && bun link`
- Verify: `bunx ccanalysis help`

### Database errors
- Initialize database: `bunx ccanalysis init`
- Check permissions on `~/.ccanalysis/` directory

### View collected data
```bash
bunx ccanalysis status    # View statistics
bunx ccanalysis sessions  # List recent sessions
```

## Development

### Testing Hooks

The CLI commands accept JSON via stdin. You can test them directly:

```bash
# Test track-tool-start
echo '{"session_id":"test-123","cwd":"/tmp","tool_name":"Read","tool_input":{"file_path":"/tmp/test.txt"}}' | bunx ccanalysis track-tool-start

# Test track-prompt
echo '{"session_id":"test-123","cwd":"/tmp","user_prompt":"Hello Claude"}' | bunx ccanalysis track-prompt

# Test track-tool-end
echo '{"session_id":"test-123","tool_name":"Read","tool_output":"file contents","success":true}' | bunx ccanalysis track-tool-end
```

### Modifying Tracking Behavior

All tracking logic lives in the CLI (`../cli/index.ts`). To modify what gets tracked or how it's stored:

1. Edit `../cli/index.ts`
2. Test using the CLI commands above
3. No need to reinstall the plugin - the hooks just call the CLI

## File Structure

```
tracker/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── hooks/
│   └── hooks.json           # Hook configuration (calls CLI)
└── README.md
```

**No package.json, no dependencies, no scripts** - just hook definitions!

## Privacy

All data is stored locally in `~/.ccanalysis/data.sqlite`. Nothing is sent to external servers. The tracker only captures:
- Tool names and parameters
- User prompts (your input to Claude)
- Session metadata (timestamps, project paths)

You can delete the database at any time: `rm ~/.ccanalysis/data.sqlite`
