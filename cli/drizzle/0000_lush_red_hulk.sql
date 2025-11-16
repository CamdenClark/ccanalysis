CREATE TABLE `agent_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`parent_agent_id` text,
	`agent_type` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`duration_ms` integer,
	`total_tokens` integer DEFAULT 0,
	`status` text DEFAULT 'active' NOT NULL,
	`result` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`event_type` text NOT NULL,
	`event_data` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `model_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`response` text NOT NULL,
	`input_tokens` integer DEFAULT 0,
	`output_tokens` integer DEFAULT 0,
	`model_name` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_path` text NOT NULL,
	`git_repo_url` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`duration_ms` integer,
	`total_tokens` integer DEFAULT 0,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tool_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`tool_name` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`duration_ms` integer,
	`input_tokens` integer DEFAULT 0,
	`output_tokens` integer DEFAULT 0,
	`success` integer,
	`error_message` text,
	`parameters` text,
	`result` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`prompt` text NOT NULL,
	`is_interruption` integer DEFAULT false,
	`tokens_used` integer DEFAULT 0,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
