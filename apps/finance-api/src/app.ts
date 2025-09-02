// ## File: apps/finance-api/src/app.ts

import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import defaultHook from "stoker/openapi/default-hook";
import { ulid } from "ulid";

// Local application imports
import { AppEnv, Vars } from "./adapters/hono/types";
import { getCommandLayer } from "./application/commands";
import { env } from "./config";
import { getPersistenceLayer } from "./infra/persistence";
import { realEstateRoutes } from "./routes/commands/real-estate/real-estate.commands.routes";

// We'll use OpenAPIHono and provide the `Vars` type to ensure our context is strongly typed.
const app = new OpenAPIHono<{ Variables: Vars }>({
  defaultHook,
});

// --- Dependency Injection Setup ---
// This block is crucial for making our application's core logic
// available to the web framework layer.

// First, we configure environment-specific helpers like ID generation and timestamps.
const app_env = {
  newId: () => ulid(),
  now: () => new Date(),
  now_iso: () => new Date().toISOString(),
} satisfies AppEnv;

// Then, we instantiate our persistence layer (repositories and Unit of Work).
const persistance_layer = getPersistenceLayer();

// Next, we create the command layer, injecting the persistence and env dependencies.
// This gives us our command handlers.
const handlers = getCommandLayer({ persistance_layer, app_env });

// Finally, we create a middleware that runs for every request.
// It injects the dependencies into Hono's context (`c.var`), making them
// accessible in our route handlers.
app.use("*", async (c, next) => {
  // For demonstration, we set a static user ID. In a real app, this would
  // be replaced by your authentication middleware.
  c.set("userId", "usr_demo123");

  c.set("env", app_env);
  c.set("handlers", handlers); // This makes the command handlers available.
  c.set("persistence", persistance_layer); // Injects the full persistence layer into context

  await next();
});
// --- End of Dependency Injection Setup ---

// Standard Hono middlewares for logging, security, and CORS.
app.use("*", logger());
app.use("*", prettyJSON());
app.use(secureHeaders());
app.use("/", cors({ origin: "*" }));

// A custom error handler to catch unexpected errors and return a clean JSON response.
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err); // Log the full error server-side for debugging.
  return c.json({ message: "An internal server error occurred" }, 500);
});

// --- Application Routes ---
app.get("/", (c) => c.text(`API v1.0: ${env.NODE_ENV} is running`));

// --- Health Check ---
app.on(["GET", "HEAD"], "/healthcheck", (c) => {
  if (c.req.method === "HEAD") return c.body(null, 200); // empty body for HEAD
  return c.text("System Healthy");
});

// We mount our domain-specific routes under a versioned path.
// OpenAPIHono will automatically discover the route definitions within `realEstateRoutes`.
app.route("/v1/commands/real-estate", realEstateRoutes);

// --- OpenAPI and Documentation UI ---

// This endpoint serves the raw OpenAPI 3.0 specification as a JSON file.
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1",
    title: "Finance API",
  },
});

// This sets up the modern Scalar UI for browsing the API documentation.
app.get(
  "/docs",
  Scalar({
    theme: "kepler",
    layout: "modern",
    url: "/openapi.json",
  })
);

// This sets up the classic Swagger UI.
app.get(
  "/swagger",
  swaggerUI({
    url: "/openapi.json",
  })
);

export default app;
