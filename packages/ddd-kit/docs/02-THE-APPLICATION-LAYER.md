# The Application Layer: Orchestrating the Work

The application layer acts as a thin coordinator. It doesn't contain business logic itself, but it knows how to orchestrate the domain objects to get the job done. It's the bridge between the outside world (HTTP requests) and the domain core.

### The Command Pattern

To keep things clean, we model every use case as a **Command**. A Command is a simple object that represents an intention to do something.

The `ICommand` interface from `ddd-kit` formalizes this. It's a class with a single method, `execute`, that takes the command's data (`payload`) and the current state of an aggregate, and returns the new state.

```typescript
// packages/ddd-kit/src/application/command/command.ts
export interface ICommand<
  TPayload,
  TResponse,
  TAggregate extends AggregateRoot
> {
  execute(
    payload: TPayload,
    aggregate?: TAggregate
  ): Result<CommandOutput<TAggregate, TResponse>>;
}
```

Here's a real-world example from our `finance-api`. Notice how it's just a plain class that calls a method on the aggregate.

```typescript
// apps/finance-api/src/application/commands/real-estate/add-appraisal/add-appraisal.command.ts
import { ICommand, CommandOutput, ok, Result } from "@acme/ddd-kit";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";

export class AddAppraisalCommand
  implements ICommand<{ id: string; date: string; value: number }, { appraisalId: string }, RealEstate>
{
  constructor(private readonly deps: { newId(): string }) {}

  public execute(payload: any, aggregate?: RealEstate): Result<CommandOutput<RealEstate, any>> {
    if (!aggregate) {
      throw new Error("Cannot add an appraisal to a non-existent asset.");
    }

    // 1. Prepare data for the domain
    const appraisalId = `appr_${this.deps.newId()}`;
    const value = Money.from(payload.value, aggregate.details.baseCurrency);

    // 2. Call the aggregate method
    aggregate.addAppraisal({ id: appraisalId, date: payload.date, value });

    // 3. Return the result
    return ok({
      aggregate: aggregate,
      response: { appraisalId: appraisalId },
      events: aggregate.pullEvents(),
    });
  }
}
```

## The Command Handler: Your Transactional Pipeline

The `CommandHandler` is the workhorse. It provides a simple, reusable pipeline that ensures every command is executed atomically.

Here's the flow, which happens inside a single database transaction:
1. **Load**: It fetches the aggregate from the database using a repository.
2. **Execute**: It calls the `execute` method on the correct `ICommand` object, passing in the aggregate.
3. **Save**: It persists the modified aggregate back to the database.
4. **Publish (Optional)**: It publishes any domain events that were recorded.

This structure gives you a clean, consistent, and transactional way to execute every single business operation in your system.

