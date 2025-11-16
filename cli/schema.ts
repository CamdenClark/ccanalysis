import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Sessions table - tracks individual Claude Code sessions
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  projectPath: text('project_path').notNull(),
  gitRepoUrl: text('git_repo_url'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  totalTokens: integer('total_tokens').default(0),
  status: text('status').notNull().default('active'), // active, completed, interrupted
});

// Tool calls table - tracks individual tool invocations
export const toolCalls = sqliteTable('tool_calls', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  toolName: text('tool_name').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  success: integer('success', { mode: 'boolean' }),
  errorMessage: text('error_message'),
  parameters: text('parameters'), // JSON string of parameters
  result: text('result'), // JSON string of result
});

// User prompts table - tracks user input and interruptions
export const userPrompts = sqliteTable('user_prompts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  prompt: text('prompt').notNull(),
  isInterruption: integer('is_interruption', { mode: 'boolean' }).default(false),
  tokensUsed: integer('tokens_used').default(0),
});

// Agent calls table - tracks sub-agent spawning and lifecycle
export const agentCalls = sqliteTable('agent_calls', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  parentAgentId: text('parent_agent_id'), // null for root agents
  agentType: text('agent_type').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  totalTokens: integer('total_tokens').default(0),
  status: text('status').notNull().default('active'), // active, completed, failed
  result: text('result'), // JSON string of result
});

// Model responses table - tracks Claude's responses
export const modelResponses = sqliteTable('model_responses', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  response: text('response').notNull(),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  modelName: text('model_name'),
});

// Events table - tracks general lifecycle events
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  eventType: text('event_type').notNull(), // session_start, session_end, error, etc.
  eventData: text('event_data'), // JSON string of additional data
});
