# CCAnalysis Tracker Plugin

A Claude Code plugin that automatically tracks session data including tool calls, user prompts, and lifecycle events.

## Overview

This plugin is a **thin wrapper** that uses simple bash hooks to forward tracking events to the CCAnalysis CLI via `bunx`. All database logic and tracking implementation lives in the CLI.

The tracker captures data about your coding sessions and stores it in the CCAnalysis database (`~/.ccanalysis/data.sqlite`).

## Architecture

The tracker plugin consists of:
- **3 bash scripts** (preToolUse.sh, userPromptSubmit.sh, postToolUse.sh)
- **1 config file** (hooks.json)
- **No TypeScript, no dependencies** - just simple bash scripts calling the CLI

Each hook script:
1. Reads JSON from stdin
2. Forwards it to `bunx ccanalysis <command>` in the background
3. Immediately returns a response (never blocks)

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

### 1. PreToolUse Hook (`preToolUse.sh`)
```bash
cat | bunx --bun ccanalysis track-tool-start > /dev/null 2>&1 &
echo '{"decision":"allow"}'
```
- Forwards event to CLI in background
- Always allows tools to proceed (non-blocking)

### 2. UserPromptSubmit Hook (`userPromptSubmit.sh`)
```bash
cat | bunx --bun ccanalysis track-prompt > /dev/null 2>&1 &
echo '{}'
```
- Forwards event to CLI in background
- Never blocks user prompts

### 3. PostToolUse Hook (`postToolUse.sh`)
```bash
cat | bunx --bun ccanalysis track-tool-end > /dev/null 2>&1 &
echo '{}'
```
- Forwards event to CLI in background
- Never blocks tool results

## Hook Configuration

Hooks are configured in `hooks/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "${HOOK_DIR}/preToolUse.sh",
        "timeout": 5000
      }]
    }],
    "UserPromptSubmit": [...],
    "PostToolUse": [...]
  }
}
```

## Performance

The tracker is designed to be **extremely lightweight**:
- Hooks are simple bash scripts (no compilation, no runtime overhead)
- All processing happens in the background (non-blocking)
- CLI operations run asynchronously via `&`
- 5-second timeout ensures hooks never hang
- Errors in tracking never affect Claude Code functionality

## Troubleshooting

### Hooks not firing
- Ensure plugin is properly installed in Claude Code
- Verify hook scripts are executable: `ls -l hooks/*.sh`
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

### Testing Hooks Locally

You can test hooks by piping JSON to them:

```bash
# Test preToolUse
echo '{"session_id":"test-123","cwd":"/tmp","tool_name":"Read","tool_input":{"file_path":"/tmp/test.txt"}}' | ./hooks/preToolUse.sh

# Test userPromptSubmit
echo '{"session_id":"test-123","cwd":"/tmp","user_prompt":"Hello Claude"}' | ./hooks/userPromptSubmit.sh

# Test postToolUse
echo '{"session_id":"test-123","tool_name":"Read","tool_output":"file contents","success":true}' | ./hooks/postToolUse.sh
```

### Modifying Hooks

1. Edit bash scripts in `hooks/`
2. Test locally using the commands above
3. Reinstall plugin in Claude Code
4. Restart Claude Code to pick up changes

**Note:** All tracking logic lives in the CLI. To modify tracking behavior, edit `../cli/index.ts` instead.

## File Structure

```
tracker/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── hooks/
│   ├── hooks.json           # Hook configuration
│   ├── preToolUse.sh        # Pre-tool hook (bash)
│   ├── userPromptSubmit.sh  # User prompt hook (bash)
│   └── postToolUse.sh       # Post-tool hook (bash)
└── README.md
```

**No package.json, no tsconfig.json, no dependencies** - just simple bash scripts!

## Privacy

All data is stored locally in `~/.ccanalysis/data.sqlite`. Nothing is sent to external servers. The tracker only captures:
- Tool names and parameters
- User prompts (your input to Claude)
- Session metadata (timestamps, project paths)

You can delete the database at any time: `rm ~/.ccanalysis/data.sqlite`
