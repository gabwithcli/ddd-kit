# RealEstate Aggregate

## Invariants
- Purchase is mandatory on creation
- Appraisal/Market valuation dates ≥ purchase date
- All price points share baseCurrency

## Commands
- `createRealEstate`
- `addAppraisal`
- `addMarketValuation`
- `updateRealEstateDetails`

## Persistence
- CRUD: `real_estates` + child tables, `version` for optimistic concurrency
- ES (optional): events emitted by the aggregate are appended and projected to read models later
