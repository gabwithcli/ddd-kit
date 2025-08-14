// packages/sdk-lite/src/domain/index.ts

// Re-export domain primitives
export * from "./aggregate"; // AggregateRoot, Entity, ValueObject, etc.

// re-export shared errors like DomainInvariantError
export * from "../shared/errors";
