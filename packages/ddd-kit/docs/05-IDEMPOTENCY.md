# Idempotency: Making Operations Safe to Retry

In a distributed system, network failures are a fact of life. A client might send a request to create a real estate asset, the server processes it, but the response gets lost on its way back. The client, unsure of what happened, sends the *exact same request* again. Without idempotency, you'd create two identical assets.

**Idempotency** ensures that no matter how many times you repeat the same operation, the outcome is the same as if you had performed it only once.

### How it Works: The `withIdempotency` Wrapper

`ddd-kit` provides a helper function, `withIdempotency`, that wraps your command execution logic. It follows a simple, robust flow:
1.  **Check for an Idempotency Key**: The client must provide a unique key (e.g., a UUID) for each distinct operation.
2.  **Claim the Key**: Before executing the command, the wrapper tries to "claim" this key in an `IdempotencyStore` within the same database transaction.
    - **If the key is new**: The claim succeeds, and the command logic proceeds.
    - **If the key has already been claimed and has a saved response**: The wrapper immediately returns the saved response without running the logic again.
3.  **Execute and Save**: If the command runs successfully, its response is saved to the store against the idempotency key before the transaction commits.
4.  **Handle Failures**: If the command fails, nothing is saved, and the operation can be retried later with the same key.

### Using It in Practice

You would typically apply this wrapper at the edge of your system, just before calling your `CommandHandler`.

```typescript
// A simplified example of how you might wire it up.
import { withIdempotency, UnitOfWork, IdempotencyStore } from "@acme/ddd-kit";

async function handleApiRequest(
    commandName: string,
    commandPayload: any,
    idempotencyKey: string | null
) {
    const uow: UnitOfWork = /* your PostgresUoW */;
    const idemStore: IdempotencyStore = /* your PostgresIdempotencyStore */;
    const commandHandler = /* your RealEstateCommandHandler */;

    // Wrap the call to the command handler with the idempotency logic.
    const result = await withIdempotency(
        {
            options: {
                key: idempotencyKey, // The key from the client
                command: commandName,
                scope: { userId: commandPayload.userId }, // Prevents key collisions between users
                payload: commandPayload,
            }
        },
        { uow, store: idemStore, hash: (s) => s /* use sha256 in prod */ },
        (tx) => {
            // This is the function that will only run if the key is new.
            // Note: The CommandHandler already uses its own transaction,
            // so in a real implementation, you'd integrate this more deeply
            // to avoid nested transactions. The principle remains the same.
            return commandHandler.execute(commandName, {
                aggregateId: commandPayload.id,
                payload: commandPayload,
            });
        }
    );

    return result;
}
```

By adopting this pattern, you make your API more robust and resilient, which is essential for building reliable systems.
