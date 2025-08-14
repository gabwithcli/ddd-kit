# ADR-0001 Aggregate Boundary for RealEstate

## Context
A "Real Estate Asset" comprises user-provided details and a timeline of price points (purchase, appraisals, market valuations).

## Decision
- Single aggregate root: **RealEstate** (`re_<ulid>`)
- Inside boundary: `details`, `purchase`, `appraisals[]`, `marketValuations[]`
- Base currency is immutable post-creation
- Commands must not cross aggregate boundaries

## Consequences
- Simple transactional invariants (date, currency)
- If history grows large, we may split timelines into a separate aggregate
