CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`appointment_id` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dose_calculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`weight` varchar(20) NOT NULL,
	`product_type` varchar(100) NOT NULL,
	`dosage` varchar(20) NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dose_calculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reschedule_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`appointment_id` int NOT NULL,
	`original_date` varchar(20) NOT NULL,
	`original_time` varchar(20) NOT NULL,
	`new_date` varchar(20) NOT NULL,
	`new_time` varchar(20) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reschedule_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slot_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`date` varchar(20) NOT NULL,
	`time` varchar(20) NOT NULL,
	`max_capacity` int NOT NULL,
	`current_count` int NOT NULL DEFAULT 0,
	`is_full` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slot_limits_id` PRIMARY KEY(`id`)
);
