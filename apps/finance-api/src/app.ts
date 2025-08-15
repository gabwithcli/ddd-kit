import { OpenAPIHono, createRoute, z as zopenapi } from "@hono/zod-openapi";
import { Hono } from "hono";
import { ulid } from "ulid";
import { AppEnv, Vars } from "./adapters/hono/types";
import { env } from "./config";
import { realEstateRoutes } from "./routes/real-estate.routes";

// Use OpenAPIHono so we can define routes + serve the spec
const app = new OpenAPIHono<{ Variables: Vars }>();

// Configure global environment helpers
const app_env = {
  newId: () => ulid(),
  now: () => new Date(),
  now_iso: () => new Date().toISOString(),
} satisfies AppEnv;

// Instantiate dependencies once
const persistance_layer = getPersistenceLayer();

// Instantiate handlers once
const handlers = getCommandLayer({ persistance_layer, app_env });

app.use("*", async (c, next) => {
  // set an authenticated user id for demo; replace with your a real auth middleware
  // c.set("userId", "demo-user-123");

  c.set("env", app_env);
  c.set("handlers", handlers);

  await next();
});

// --- DOMAIN: mount real-estate routes ---
app.route("/v1/real-estates", realEstateRoutes);

// --- health ---
app.on(["GET", "HEAD"], "/healthz", (c) => {
  if (c.req.method === "HEAD") return c.body(null, 200); // empty body for HEAD
  return c.text("system healthy");
});

// --- root ---
app.get("/", (c) => c.text(`API v1.0: ${env.NODE_ENV} is running`));

// --- typed /hello with OpenAPI ---
const HelloQuery = zopenapi.object({
  name: zopenapi.string().optional().openapi({ example: "world" }),
});
const HelloResp = zopenapi.object({
  message: zopenapi.string(),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/hello",
    request: { query: HelloQuery },
    responses: {
      200: {
        description: "Greets the user",
        content: { "application/json": { schema: HelloResp } },
      },
    },
    tags: ["demo"],
  }),
  (c) => {
    const { name = "world" } = Object.fromEntries(
      new URL(c.req.url).searchParams
    ) as { name?: string };
    return c.json({ message: `Hello, ${name}!` });
  }
);

// --- serve OpenAPI JSON ---
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Hono API", version: "1.0.0" },
});

// --- docs UI (Swagger-like via Scalar) ---
import { Scalar } from "@scalar/hono-api-reference";
import { getCommandLayer } from "./application/commands";
import { getPersistenceLayer } from "./infra/persistence";
app.get(
  "/docs",
  Scalar({
    theme: "kepler",
    layout: "modern",
    url: "/openapi.json",
  })
);

// --- PostHog proxy: /ph/* -> POSTHOG_HOST/* ---
const proxy = new Hono();
proxy.all("/ph/*", async (c) => {
  const incoming = new URL(c.req.url);
  const upstreamPath = incoming.pathname.replace(/^\/ph/, "") || "/";
  const upstreamUrl = new URL(upstreamPath + incoming.search, env.POSTHOG_HOST);

  const method = c.req.method.toUpperCase();
  const headers = new Headers(c.req.raw.headers);
  headers.delete("host");
  headers.delete("content-length");

  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await c.req.arrayBuffer();

  const resp = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const respHeaders = new Headers(resp.headers);
  respHeaders.set("access-control-allow-origin", "*"); // optional

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  });
});

app.route("/", proxy);

export default app;
