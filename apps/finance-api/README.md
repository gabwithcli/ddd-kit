# Finance API

This is a backend service built with Hono for managing financial data, specifically real estate assets. It follows a Domain-Driven Design (DDD) approach to handle complex business logic.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- Node.js (v18.17 or later)
- pnpm (v9.0.0 or later)
- Docker and Docker Compose (for local db development)

## Development Setup

Follow these steps to get the API running locally for the first time.

### 1. Install Dependencies
Navigate to the monorepo root and run:

```bash
# This will install dependencies for all packages and apps
pnpm install
```

### 2. Set Up Environment Variables
In the apps/finance-api directory, copy the example environment file:

```bash
cp .env.example .env
```

Make sure the `DATABASE_URL` in the new `.env` file matches the credentials in `docker-compose.yml`. The default values should work out of the box.

### 3. Start the Database
This command uses Docker Compose to start a PostgreSQL database in a container.

```bash
pnpm db:start
```

### 4. Apply Database Migrations
This command applies the latest SQL migrations to the database schema using Drizzle Kit.

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start the Development Server
This command starts the Hono server in watch mode. It will automatically restart when you make changes to the code.

```bash
pnpm dev
```

Once running, the server will be available at `http://localhost:3000`.


## Available Scripts
- `pnpm dev`: Starts the local development server with hot-reloading.
- `pnpm db:start`: Starts the PostgreSQL database container via Docker.
- `pnpm db:stop`: Stops the database container.
- `pnpm db:generate`: Generates a new SQL migration file based on changes to the Drizzle schema. **Run this whenever you modify the schema files.**
- `pnpm db:migrate`: Applies pending migrations to the database.

## API Documentation
When the development server is running, you can access the API documentation in your browser at the following endpoints:
- **Scalar Docs**: `http://localhost:3000/docs`
- **Swagger UI**: `http://localhost:3000/swagger`
  
