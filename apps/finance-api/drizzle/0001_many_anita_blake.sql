CREATE TABLE "real_estate"."idempotency_keys" (
	"key" varchar(128) NOT NULL,
	"command_name" varchar(128) NOT NULL,
	"scope_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response_payload" jsonb,
	CONSTRAINT "idempotency_keys_key_command_name_scope_hash_pk" PRIMARY KEY("key","command_name","scope_hash")
);
