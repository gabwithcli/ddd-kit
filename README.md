# DDD Kit Monorepo

This monorepo contains a pragmatic toolkit for Domain-Driven Design in TypeScript and a sample API that demonstrates its real-world usage.

## Packages

This project is organized into two main packages: a reusable library and an example implementation.

### 🛠️ `@acme/ddd-kit` (The Toolkit)

A small collection of sharp, focused tools for taming complex business logic. It provides the core patterns of DDD (Aggregates, Commands, Repositories) without locking you into a framework.

**For a full explanation and developer guides, see the [ddd-kit README](./packages/ddd-kit/README.md)**.

### 🚀 `finance-api` (Example Implementation)

A real-world example of `ddd-kit` in action. This Hono-based API manages real estate assets and showcases how to structure a full application—from the HTTP layer down to the database—using the toolkit.

**For setup instructions and to run the API locally, see the [finance-api README](./apps/finance-api/README.md)**

## Getting Started

To get started with this monorepo, clone the repository and install all dependencies from the root directory using pnpm.

```bash
pnpm install
```

After installation, follow the specific setup instructions in the `README.md` of the package/app you wish to work on.

