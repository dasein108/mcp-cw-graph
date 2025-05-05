# ---- Build Stage ----
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production Stage ----
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --omit=dev
ENV TRANSFORMERS_CACHE=/app/hf-cache
EXPOSE 8000
# Install supergateway at runtime (not as dependency)
ENTRYPOINT ["npx", "-y", "supergateway", "--stdio", "node ./dist/index.js", "--cors", "*", "--port", "8000"] 