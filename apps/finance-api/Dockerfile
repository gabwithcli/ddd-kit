# --- builder ---
FROM node:20-alpine AS build
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# deps first for better caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build (your "build" script runs esbuild to emit dist/index.js)
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# --- runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# With esbuild bundling, you don't need node_modules at runtime
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:3000/healthz").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'

CMD ["node", "dist/index.js"]
