#!/usr/bin/env bun
import { initDb, runMigrations, getDbPath } from './db';
import { sessions, toolCalls, userPrompts, agentCalls, modelResponses, events } from './schema';
import { eq, desc, sql, and, isNull } from 'drizzle-orm';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

/**
 * Generates a unique ID for records
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Reads JSON from stdin
 */
async function readStdin(): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(Buffer.from(chunk));
  }
  const input = Buffer.concat(chunks).toString('utf-8');
  return JSON.parse(input);
}

/**
 * Ensures a session exists in the database
 */
async function ensureSession(db: ReturnType<typeof initDb>, sessionId: string, projectPath: string) {
  const existing = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

  if (existing.length === 0) {
    await db.insert(sessions).values({
      id: sessionId,
      projectPath,
      startedAt: new Date(),
      status: 'active',
      totalTokens: 0,
    });
  }
}

async function main() {
  // Initialize database
  const db = initDb();

  // Handle different commands
  switch (command) {
    case 'init':
      console.log('Initializing CCAnalysis database...');
      runMigrations(db);
      console.log('Database initialized successfully!');
      console.log(`Database location: ${getDbPath()}`);
      break;

    case 'status':
      console.log('CCAnalysis Database Status');
      console.log('='.repeat(50));
      console.log(`Database location: ${getDbPath()}`);

      // Count records in each table
      const sessionCount = await db.select({ count: sql<number>`count(*)` }).from(sessions);
      const toolCallCount = await db.select({ count: sql<number>`count(*)` }).from(toolCalls);
      const promptCount = await db.select({ count: sql<number>`count(*)` }).from(userPrompts);
      const agentCount = await db.select({ count: sql<number>`count(*)` }).from(agentCalls);
      const responseCount = await db.select({ count: sql<number>`count(*)` }).from(modelResponses);
      const eventCount = await db.select({ count: sql<number>`count(*)` }).from(events);

      console.log('\nTable Statistics:');
      console.log(`  Sessions: ${sessionCount[0]?.count ?? 0}`);
      console.log(`  Tool Calls: ${toolCallCount[0]?.count ?? 0}`);
      console.log(`  User Prompts: ${promptCount[0]?.count ?? 0}`);
      console.log(`  Agent Calls: ${agentCount[0]?.count ?? 0}`);
      console.log(`  Model Responses: ${responseCount[0]?.count ?? 0}`);
      console.log(`  Events: ${eventCount[0]?.count ?? 0}`);
      break;

    case 'sessions':
      const allSessions = await db.select().from(sessions).orderBy(desc(sessions.startedAt)).limit(10);

      console.log('Recent Sessions (last 10)');
      console.log('='.repeat(50));

      if (allSessions.length === 0) {
        console.log('No sessions found.');
      } else {
        for (const session of allSessions) {
          console.log(`\nSession ID: ${session.id}`);
          console.log(`  Project: ${session.projectPath}`);
          console.log(`  Started: ${session.startedAt}`);
          console.log(`  Status: ${session.status}`);
          console.log(`  Total Tokens: ${session.totalTokens}`);
          if (session.durationMs) {
            console.log(`  Duration: ${(session.durationMs / 1000).toFixed(2)}s`);
          }
        }
      }
      break;

    case 'track-tool-start':
      try {
        const toolStartInput = await readStdin();
        const { session_id, cwd, tool_name, tool_input } = toolStartInput;

        await ensureSession(db, session_id, cwd);

        const toolCallId = generateId();
        await db.insert(toolCalls).values({
          id: toolCallId,
          sessionId: session_id,
          toolName: tool_name,
          startedAt: new Date(),
          parameters: JSON.stringify(tool_input),
          inputTokens: 0,
          outputTokens: 0,
        });

        // PreToolUse hook expects {"decision": "allow"}
        console.log(JSON.stringify({ decision: 'allow' }));
      } catch (error) {
        // On error, still allow the tool
        console.log(JSON.stringify({ decision: 'allow' }));
      }
      break;

    case 'track-tool-end':
      try {
        const toolEndInput = await readStdin();
        const { session_id, tool_name, tool_response, success: toolSuccess, error_message } = toolEndInput;

        // Find the most recent incomplete tool call
        const recentToolCall = await db
          .select()
          .from(toolCalls)
          .where(
            and(
              eq(toolCalls.sessionId, session_id),
              eq(toolCalls.toolName, tool_name),
              isNull(toolCalls.endedAt)
            )
          )
          .orderBy(desc(toolCalls.startedAt))
          .limit(1);

        if (recentToolCall.length > 0) {
          const toolCall = recentToolCall[0];
          const endTime = new Date();
          const startTime = toolCall.startedAt as Date;
          const durationMs = endTime.getTime() - startTime.getTime();

          await db
            .update(toolCalls)
            .set({
              endedAt: endTime,
              durationMs,
              success: toolSuccess ?? true,
              errorMessage: error_message ?? null,
              result: tool_response ? JSON.stringify(tool_response) : null,
            })
            .where(eq(toolCalls.id, toolCall.id));
        }

        // PostToolUse hook expects {}
        console.log(JSON.stringify({}));
      } catch (error) {
        // On error, still return empty response
        console.log(JSON.stringify({}));
      }
      break;

    case 'track-prompt':
      try {
        const promptInput = await readStdin();
        const { session_id, cwd, user_prompt } = promptInput;

        await ensureSession(db, session_id, cwd);

        await db.insert(userPrompts).values({
          id: generateId(),
          sessionId: session_id,
          timestamp: new Date(),
          prompt: user_prompt,
          isInterruption: false,
          tokensUsed: 0,
        });

        // UserPromptSubmit hook expects {}
        console.log(JSON.stringify({}));
      } catch (error) {
        // On error, still return empty response
        console.log(JSON.stringify({}));
      }
      break;

    case 'help':
    default:
      console.log('CCAnalysis CLI - Claude Code Session Tracker');
      console.log('='.repeat(50));
      console.log('\nCommands:');
      console.log('  init              Initialize the database and run migrations');
      console.log('  status            Show database statistics');
      console.log('  sessions          List recent sessions');
      console.log('  track-tool-start  Track tool call start (reads JSON from stdin)');
      console.log('  track-tool-end    Track tool call end (reads JSON from stdin)');
      console.log('  track-prompt      Track user prompt (reads JSON from stdin)');
      console.log('  help              Show this help message');
      console.log('\nUsage:');
      console.log('  bun index.ts <command>');
      break;
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
