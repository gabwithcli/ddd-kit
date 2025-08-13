# Request Handler

## Purpose
Centralize edge concerns:
- Auth (from framework context)
- JSON parsing
- Zod validation
- Mapping to an executor DTO

## Example with Hono

```ts
import { makeRequestHandler, authFromContext, respond, ok } from "@acme/sdk-lite";
import { z } from "zod";

const CreateBody = z.object({
  vendorId: z.string().min(1),
  idempotencyKey: z.string().min(1).nullable(),
});

const handleCreate = makeRequestHandler({
  auth: authFromContext("userId"),
  bodySchema: CreateBody,
  map: ({ auth, body }) => ok({ userId: auth.userId, ...body })
});

app.post("/orders", async (c) => {
  const req = await handleCreate(c);
  if (!req.ok) return respond(c, req);
  const res = await appHandler.handle(req.value);
  return respond(c, res, 201);
});
```
