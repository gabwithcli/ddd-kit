# Errors & HTTP Mapping

- **DomainInvariantError** — throw inside domain/policy checks; map to 422.
- **EdgeError** — standard shapes returned by request handlers.

Use `respond()` to convert `Result<T, EdgeError>` to HTTP.
Customize `statusOf()` per service if needed.
