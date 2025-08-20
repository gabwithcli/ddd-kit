/**
 * @acme/ddd-kit — Barrel exports
 *
 * Why a single "index" file?
 * - Consumers can import everything from one place:
 * import { ok, withIdempotency } from "@acme/ddd-kit";
 * - Internally we keep small modules (single responsibility) and re-export them here.
 */

// Result + errors
export * from "./shared/errors";
export * from "./shared/result";

// Infra ports
export * from "./infra/idempotency-store";
export * from "./infra/unit-of-work";

// Idempotency orchestrator
export * from "./idempotency/types";
export * from "./idempotency/with-idempotency";

// HTTP edge helpers
export * from "./http/request-handler";
export * from "./http/respond";
export * from "./http/status";

// Command blueprints (CRUD + ES)
export * from "./application/command";
export * from "./application/command/command";
export * from "./application/command/handler";

// Policies (application-layer contextual rules)
export * from "./application/policies";

// Aggregate primitives
export * from "./application/repos";

// Exporting domain primitives (like AggregateRoot) from the main entry point.
export * from "./domain";

// Test doubles
export * from "./memory/console-event-publisher.memory";
export * from "./memory/idempotency-store.memory";
export * from "./memory/unit-of-work.memory";

// NOTE: we do NOT re-export the "domain" folder here to avoid naming collisions.
// Apps can import domain primitives via the subpath: @acme/ddd-kit/domain
