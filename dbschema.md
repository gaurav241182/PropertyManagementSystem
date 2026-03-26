CREATE SCHEMA "public";
CREATE TABLE "booking_charges" (
	"id" serial PRIMARY KEY,
	"booking_id" text NOT NULL,
	"order_id" text,
	"description" text NOT NULL,
	"category" text DEFAULT 'Room' NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY,
	"booking_id" text NOT NULL CONSTRAINT "bookings_booking_id_unique" UNIQUE,
	"guest_name" text NOT NULL,
	"guest_email" text,
	"guest_phone" text,
	"guest_last_name" text DEFAULT '' NOT NULL,
	"room_id" integer NOT NULL,
	"room_type_id" integer NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"nights" integer DEFAULT 1 NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"advance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_method" text DEFAULT 'Cash',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"checked_in_at" timestamp,
	"checked_out_at" timestamp,
	"discount_info" text,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"hotel_id" integer,
	"branch_id" integer,
	"source" text DEFAULT 'Direct' NOT NULL
);
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY,
	"hotel_id" integer NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"type" text NOT NULL,
	"subtype" text DEFAULT '' NOT NULL,
	"item" text NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "expense_daily_files" (
	"id" serial PRIMARY KEY,
	"hotel_id" integer,
	"branch_id" integer,
	"record_date" date NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"file_data" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY,
	"date" date NOT NULL,
	"record_date" date NOT NULL,
	"category" text NOT NULL,
	"sub_category" text DEFAULT '' NOT NULL,
	"item" text NOT NULL,
	"qty" text DEFAULT '1' NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"has_receipt" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer,
	"receipt_file_name" text,
	"receipt_file" text
);
CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'item' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_free" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"taxable" boolean DEFAULT false NOT NULL,
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "hotel_roles" (
	"id" serial PRIMARY KEY,
	"hotel_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"permissions" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "hotels" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"tax_id" text DEFAULT '',
	"owner_name" text NOT NULL,
	"owner_email" text NOT NULL,
	"owner_phone" text DEFAULT '',
	"owner_dob" date,
	"owner_id_number" text DEFAULT '',
	"admin_login" text NOT NULL,
	"logo_url" text DEFAULT '',
	"branches" text DEFAULT '[]' NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"monthly_charges" text DEFAULT '0' NOT NULL,
	"custom_domain" text DEFAULT '',
	"from_email" text DEFAULT '',
	"owner_documents" text DEFAULT '[]'
);
CREATE TABLE "invoice_scheduler_logs" (
	"id" serial PRIMARY KEY,
	"job_type" text DEFAULT 'manual' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_invoices" integer DEFAULT 0 NOT NULL,
	"emails_sent" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Food' NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "menus" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"type" text DEFAULT 'Daily' NOT NULL,
	"start_date" date,
	"end_date" date,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"item_ids" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY,
	"order_id" text NOT NULL,
	"item_name" text NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"order_id" text NOT NULL CONSTRAINT "orders_order_id_unique" UNIQUE,
	"booking_id" text NOT NULL,
	"guest_name" text NOT NULL,
	"room_number" text NOT NULL,
	"type" text DEFAULT 'Food' NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer,
	"serving_time" timestamp,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp
);
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "platform_users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"hotel_id" integer,
	"status" text DEFAULT 'Active' NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"password" text DEFAULT 'password123' NOT NULL,
	"hotel_role_id" integer
);
CREATE TABLE "room_blocks" (
	"id" serial PRIMARY KEY,
	"room_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "room_pricing" (
	"id" serial PRIMARY KEY,
	"room_type_id" integer NOT NULL,
	"date" date NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "room_types" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"beds" text DEFAULT '1 Queen Bed' NOT NULL,
	"base_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"size" text DEFAULT '' NOT NULL,
	"facility_ids" text DEFAULT '[]' NOT NULL,
	"max_adults" integer DEFAULT 2 NOT NULL,
	"max_children" integer DEFAULT 0 NOT NULL,
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY,
	"room_number" text NOT NULL,
	"room_type_id" integer NOT NULL,
	"floor" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"room_name" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"photos" text DEFAULT '[]' NOT NULL,
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "salaries" (
	"id" serial PRIMARY KEY,
	"staff_id" integer NOT NULL,
	"month" text NOT NULL,
	"basic_salary" numeric(10, 2) DEFAULT '0' NOT NULL,
	"bonus" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deductions" numeric(10, 2) DEFAULT '0' NOT NULL,
	"welfare_contribution" numeric(10, 2) DEFAULT '0' NOT NULL,
	"net_pay" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"paid_date" date,
	"created_at" timestamp DEFAULT now(),
	"advance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"due_date" date,
	"hotel_id" integer,
	"branch_id" integer,
	"instalment_deduction" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_final_settlement" boolean DEFAULT false NOT NULL,
	"pro_rate_days" integer,
	"total_days_in_month" integer
);
CREATE TABLE "salary_scheduler_logs" (
	"id" serial PRIMARY KEY,
	"hotel_id" integer,
	"branch_id" integer,
	"job_type" text DEFAULT 'manual' NOT NULL,
	"month" text NOT NULL,
	"total_staff" integer DEFAULT 0 NOT NULL,
	"generated" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"details" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"hotel_id" integer,
	"branch_id" integer
);
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY,
	"employee_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"email" text,
	"phone" text,
	"salary" numeric(10, 2) DEFAULT '0' NOT NULL,
	"join_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"welfare_enabled" boolean DEFAULT false NOT NULL,
	"bonus_enabled" boolean DEFAULT false NOT NULL,
	"bonus_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"dob" date,
	"gender" text,
	"nationality" text,
	"state" text,
	"city" text,
	"address" text,
	"country_code" text DEFAULT '+1',
	"basic_pay" numeric(10, 2) DEFAULT '0',
	"hra" numeric(10, 2) DEFAULT '0',
	"transport" numeric(10, 2) DEFAULT '0',
	"allowance" numeric(10, 2) DEFAULT '0',
	"emergency_name" text,
	"emergency_relation" text,
	"emergency_phone" text,
	"id_card_number" text,
	"police_verification" boolean DEFAULT false,
	"photo" text,
	"hotel_id" integer,
	"branch_id" integer,
	"id_document" text,
	"id_document_name" text
);
CREATE TABLE "staff_advances" (
	"id" serial PRIMARY KEY,
	"hotel_id" integer,
	"branch_id" integer,
	"staff_id" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"instalment_amount" numeric(10, 2) NOT NULL,
	"total_instalments" integer NOT NULL,
	"remaining_instalments" integer NOT NULL,
	"remaining_balance" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"start_month" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"instalment_start_month" text
);
CREATE UNIQUE INDEX "booking_charges_pkey" ON "booking_charges" ("id");
CREATE UNIQUE INDEX "bookings_booking_id_unique" ON "bookings" ("booking_id");
CREATE UNIQUE INDEX "bookings_pkey" ON "bookings" ("id");
CREATE UNIQUE INDEX "branches_pkey" ON "branches" ("id");
CREATE UNIQUE INDEX "categories_pkey" ON "categories" ("id");
CREATE UNIQUE INDEX "expense_daily_files_pkey" ON "expense_daily_files" ("id");
CREATE UNIQUE INDEX "expenses_pkey" ON "expenses" ("id");
CREATE UNIQUE INDEX "facilities_pkey" ON "facilities" ("id");
CREATE UNIQUE INDEX "hotel_roles_pkey" ON "hotel_roles" ("id");
CREATE UNIQUE INDEX "hotels_pkey" ON "hotels" ("id");
CREATE UNIQUE INDEX "invoice_scheduler_logs_pkey" ON "invoice_scheduler_logs" ("id");
CREATE UNIQUE INDEX "menu_items_pkey" ON "menu_items" ("id");
CREATE UNIQUE INDEX "menus_pkey" ON "menus" ("id");
CREATE UNIQUE INDEX "order_items_pkey" ON "order_items" ("id");
CREATE UNIQUE INDEX "orders_order_id_unique" ON "orders" ("order_id");
CREATE UNIQUE INDEX "orders_pkey" ON "orders" ("id");
CREATE UNIQUE INDEX "password_reset_tokens_pkey" ON "password_reset_tokens" ("id");
CREATE UNIQUE INDEX "platform_users_pkey" ON "platform_users" ("id");
CREATE UNIQUE INDEX "room_blocks_pkey" ON "room_blocks" ("id");
CREATE UNIQUE INDEX "room_pricing_pkey" ON "room_pricing" ("id");
CREATE UNIQUE INDEX "room_types_pkey" ON "room_types" ("id");
CREATE UNIQUE INDEX "rooms_pkey" ON "rooms" ("id");
CREATE UNIQUE INDEX "salaries_pkey" ON "salaries" ("id");
CREATE UNIQUE INDEX "salary_scheduler_logs_pkey" ON "salary_scheduler_logs" ("id");
CREATE UNIQUE INDEX "settings_pkey" ON "settings" ("id");
CREATE UNIQUE INDEX "staff_pkey" ON "staff" ("id");
CREATE UNIQUE INDEX "staff_advances_pkey" ON "staff_advances" ("id");