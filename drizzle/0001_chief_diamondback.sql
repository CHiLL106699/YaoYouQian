CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`service_id` int,
	`appointment_date` timestamp NOT NULL,
	`appointment_time` varchar(10) NOT NULL,
	`status` enum('pending','approved','completed','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`service` varchar(200),
	`customer_name` varchar(100),
	`customer_phone` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `booking_slot_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`time_slot` varchar(10) NOT NULL,
	`max_capacity` int NOT NULL DEFAULT 5,
	`current_bookings` int NOT NULL DEFAULT 0,
	`is_available` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_slot_limits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`line_user_id` varchar(100),
	`name` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`birthday` timestamp,
	`gender` enum('male','female','other'),
	`address` text,
	`notes` text,
	`tags` text,
	`total_spent` decimal(10,2) DEFAULT '0.00',
	`visit_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`product_name` varchar(200) NOT NULL,
	`quantity` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`order_number` varchar(50) NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`status` enum('pending','paid','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
	`shipping_address` text,
	`tracking_number` varchar(100),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`category` varchar(100),
	`image_url` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`duration` int NOT NULL,
	`category` varchar(100),
	`image_url` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`logo_url` text,
	`primary_color` varchar(20) DEFAULT '#8B5CF6',
	`custom_domain` varchar(255),
	`line_channel_id` varchar(100),
	`line_channel_secret` varchar(100),
	`line_channel_access_token` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_settings_tenant_id_unique` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`plan` enum('basic','professional','enterprise') NOT NULL,
	`status` enum('active','past_due','cancelled') NOT NULL DEFAULT 'active',
	`stripe_customer_id` varchar(100),
	`stripe_subscription_id` varchar(100),
	`current_period_start` timestamp,
	`current_period_end` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`subdomain` varchar(100) NOT NULL,
	`owner_line_user_id` varchar(100),
	`status` enum('trial','active','suspended','cancelled') NOT NULL DEFAULT 'trial',
	`trial_ends_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `time_slot_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`slots` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `time_slot_templates_id` PRIMARY KEY(`id`)
);
