PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active',
	`content` text NOT NULL,
	`reasoning` text,
	`tokens` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "session_id", "role", "status", "content", "reasoning", "tokens", "created_at") SELECT "id", "session_id", "role", "status", "content", "reasoning", "tokens", "created_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;