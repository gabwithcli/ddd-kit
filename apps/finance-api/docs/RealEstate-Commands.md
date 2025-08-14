# RealEstate Commands

## createRealEstate
Input: details (name, address, baseCurrency, notes), purchase (date, value)
Output: { id }

## addAppraisal
Input: id, date, amount
Rules: date ≥ purchaseDate; currency = baseCurrency

## addMarketValuation
Input: id, date, amount
Rules: date ≥ purchaseDate; currency = baseCurrency

## updateRealEstateDetails
Input: id, (name?), (address?), (notes?)
Rules: name must not be empty; baseCurrency is immutable
