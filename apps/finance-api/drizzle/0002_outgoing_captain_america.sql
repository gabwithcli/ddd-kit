CREATE TABLE "real_estate"."real_estate_summaries" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"user_id" varchar(40) NOT NULL,
	"name" varchar(256) NOT NULL,
	"city" varchar(128) NOT NULL,
	"country" varchar(64) NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_value" numeric(14, 2) NOT NULL,
	"base_currency" varchar(3) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
