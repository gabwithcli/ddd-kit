// packages/sdk-lite/src/domain/index.ts

// Re-export domain primitives
export * from "./aggregate"; // AggregateRoot, Entity, ValueObject, etc.
export * from "./invariants"; // DomainInvariantError, invariants DSL

// re-export shared errors like DomainInvariantError
export * from "../shared/errors";
