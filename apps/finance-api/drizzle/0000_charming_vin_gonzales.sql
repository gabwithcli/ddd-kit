CREATE SCHEMA "projections";
--> statement-breakpoint
CREATE SCHEMA "real_estate";
--> statement-breakpoint
CREATE SCHEMA "utilities";
--> statement-breakpoint
CREATE TABLE "projections"."real_estate_summaries" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"user_id" varchar(40) NOT NULL,
	"name" varchar(256) NOT NULL,
	"city" varchar(128) NOT NULL,
	"country" varchar(64) NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_value" numeric(14, 2) NOT NULL,
	"base_currency" varchar(3) NOT NULL,
	"latest_valuation_date" date,
	"latest_valuation_value" numeric(14, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate"."real_estate_appraisals" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"real_estate_id" varchar(40) NOT NULL,
	"date" date NOT NULL,
	"value" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate"."real_estates" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"user_id" varchar(40) NOT NULL,
	"name" varchar(256) NOT NULL,
	"addr1" varchar(256) NOT NULL,
	"addr2" varchar(256),
	"postal_code" varchar(32) NOT NULL,
	"city" varchar(128) NOT NULL,
	"state" varchar(128),
	"country" varchar(64) NOT NULL,
	"notes" varchar(2000),
	"base_currency" varchar(3) NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_value" numeric(14, 2) NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "real_estate"."real_estate_valuations" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"real_estate_id" varchar(40) NOT NULL,
	"date" date NOT NULL,
	"value" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utilities"."idempotency_keys" (
	"key" varchar(128) NOT NULL,
	"command_name" varchar(128) NOT NULL,
	"scope_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response_payload" jsonb,
	CONSTRAINT "idempotency_keys_key_command_name_scope_hash_pk" PRIMARY KEY("key","command_name","scope_hash")
);
