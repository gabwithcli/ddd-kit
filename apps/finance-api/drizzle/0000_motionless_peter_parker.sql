CREATE SCHEMA "real_estate";
--> statement-breakpoint
CREATE TABLE "real_estate"."real_estate_appraisals" (
	"real_estate_id" varchar(40) NOT NULL,
	"date" date NOT NULL,
	"value" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_estate"."real_estate_market_vals" (
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
