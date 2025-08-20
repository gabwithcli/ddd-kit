# @acme/ddd-kit — Overview

**Purpose:** give small teams a pragmatic toolkit for:
- Command execution with idempotency + UoW
- CRUD or Event Sourced storage
- DDD tactical patterns (Entity, ValueObject, AggregateRoot)

## Design Principles
- **Domain first.** Invariants live inside aggregate methods.
- **Small, explicit boundaries.** One aggregate per command.
- **Storage agnostic.** CRUD today, ES tomorrow—same domain code.

## Key Building Blocks
- `domain/aggregate.ts`: Entity, ValueObject, AggregateRoot, DomainInvariantError
- `application/repos/aggregate.crud.ts`: CRUD repo port (load/save)
- `application/repos/aggregate.es.ts`: ES repo port (load/append)
- Command runners (in your app): load → mutate → save/append → publish

## Concurrency
- CRUD: integer `version` column (+ optimistic concurrency)
- ES: `expectedRevision` on streams

## Errors
- Throw `DomainInvariantError` for rule violations → map to HTTP 422
