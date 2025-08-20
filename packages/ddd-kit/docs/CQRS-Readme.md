# CQRS in @acme/ddd-kit

**Writes:** enact a single aggregate mutation per command.
**Reads:** shape whatever view you want (joins, projections, caches).

Benefits:
- Write models stay clean and enforce rules.
- Read models can evolve without risking write-side complexity.
- Eventual consistency is OK for reads; strong consistency on the aggregate boundary for writes.
