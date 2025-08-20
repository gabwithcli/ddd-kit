# The Interface Layer: Connecting to HTTP

The interface layer is where you expose your application to the outside world. For us, this is typically a REST or RPC-style API over HTTP. The goal is to keep this layer as thin as possible. Its job is to translate HTTP requests into commands and then translate the results back into HTTP responses.

### A Reusable Request Handler

Handling HTTP requests often involves a lot of boilerplate: checking authentication, parsing the JSON body, validating the input, etc. `ddd-kit` provides `makeRequestHandler` to standardize this process.

It creates a function that performs a sequence of steps:
1.  **Auth**: Runs a function to check for authentication details (e.g., a user ID in the context).
2.  **Parse & Validate**: Reads the request body and validates it against a Zod schema.
3.  **Map**: Maps the validated auth info and body into the payload needed by your `CommandHandler`.

Here's how `finance-api` uses it to create a single, powerful handler for *all* `RealEstate` commands:
```typescript
// apps/finance-api/src/adapters/hono/commands/real-estate/real-estate.commands.api-handler.ts
import { authFromContext, makeRequestHandler } from "@acme/ddd-kit";
import { RealEstateCommandRequest } from "../../../../application/commands/real-estate/commands.schema";

export const realEstateApiHandler = makeRequestHandler({
  // 1. Authenticate the request.
  auth: authFromContext("userId"),

  // 2. We use a custom body reader to get the command name from the URL
  // and combine it with the JSON payload.
  readBody: async (c: any) => {
    const path = c.req.path;
    const commandName = path.substring(path.lastIndexOf("/") + 1);
    const payload = await c.req.json();
    return {
      command: commandName,
      payload: payload,
    };
  },

  // 3. Validate the combined object against a discriminated union schema.
  bodySchema: RealEstateCommandRequest,

  // 4. Map the request to the correct command handler.
  map: ({ c, auth, body }) => {
    const handler = c.var.handlers.real_estate; // Injected handler
    const payloadWithAuth = { ...body.payload, userId: auth.userId };

    // Execute the command through the handler's transactional pipeline.
    return handler.execute(body.command, {
      aggregateId: (body.payload as any)?.id,
      payload: payloadWithAuth,
    });
  },
});
```

### Consistent API Responses with `respond`

Once your command has been executed, you get back a Result object. The `respond` helper turns this result into a proper HTTP response.
- If `result.ok` is true, it sends a JSON response with the success payload and a `2xx` status code.
- If `result.ok` is false, it uses the error `kind` to determine the correct `4xx` or `5xx` status code and sends a structured JSON error response.

This makes your route definitions incredibly concise and consistent.

```typescript
// apps/finance-api/src/routes/commands/real-estate/real-estate.commands.routes.ts
import { HttpStatus, respond } from "@acme/ddd-kit";
import { OpenAPIHono } from "@hono/zod-openapi";
import { realEstateApiHandler } from "...";
import { createRealEstateAssetRoute } from "./routes/create-real-estate-asset.openapi";

export const realEstateRoutes = new OpenAPIHono();

// A generic function that calls our request handler
const handler = (c: any) => realEstateApiHandler(c);

// The actual route definition is just a one-liner!
realEstateRoutes.openapi(createRealEstateAssetRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.CREATED) // Pass the result to respond
);
```

By combining `makeRequestHandler` and `respond`, you keep your HTTP controllers clean, declarative, and free of business logic. 
