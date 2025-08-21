# ddd-kit: A Pragmatic DDD Toolkit

Welcome, colleague. You've found `ddd-kit`, a small collection of tools designed to distill the core patterns of **Domain-Driven Design** into a pragmatic toolkit. 

This isn't a framework that will lock you in: think of it as a set of sharp knives for the specific job of taming complex business logic.

### Philosophy

In our small teams we can't afford accidental complexity, and the code we create should directly model the business domain.

For these reasons, this kit is built on a few core beliefs:

1.  **The Domain is King**: Your business rules are the most valuable asset. The code should read like a clear statement of those rules. We put them inside **Aggregate Roots**, which act as protective bubbles for our logic.
2.  **Clear Boundaries**: A request should do one thing and one thing only. We use the **Command** pattern to create a clear entry point for every business operation. The `CommandHandler` orchestrates the simple, predictable dance: **load, execute, save**.
3.  **Persistence is a Detail**: Whether you save your data to a SQL database today or an event store tomorrow shouldn't force a rewrite of your business logic. The kit provides a generic `AggregateRepository` port, decoupling your domain from the database.
4.  **Testability is Not an Optional**: Your core logic should be testable without a database, a network, or any other slow dependency. The abstractions in this kit (like the `UnitOfWork` and in-memory test doubles) make this not just possible, but easy.

### What's Inside?

Here are the main building blocks you'll be working with:

| Concept                 | Purpose                                                                                   | Location                                        |
| :---------------------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------- |
| **AggregateRoot**       | A base class for your domain models. It guards invariants and buffers domain events.      | `src/domain/aggregate.ts`                       |
| **ICommand**            | An interface that turns every business operation into a self-contained class.             | `src/application/command/command.ts`            |
| **CommandHandler**      | An orchestrator that runs your commands within a database transaction.                    | `src/application/command/handler.ts`            |
| **UnitOfWork**          | An abstraction to ensure atomic operations. All changes succeed, or none do.              | `src/infra/unit-of-work.ts`                     |
| **AggregateRepository** | A generic port for loading and saving your aggregates, hiding the database details.       | `src/application/repos/aggregate.repository.ts` |
| **HTTP Helpers**        | `makeRequestHandler` and `respond` to connect your clean core to the messy world of HTTP. | `src/http/`                                     |
| **Result Type**         | A simple `ok` or `err` wrapper to handle outcomes without exceptions.                     | `src/shared/result.ts`                          |