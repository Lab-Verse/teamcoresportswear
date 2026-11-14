FROM node:24-alpine AS build
WORKDIR /app/frontend/customer-portal
COPY frontend/customer-portal/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/customer-portal .
COPY backend/src/modules/design-studio/design-contract.ts /app/backend/src/modules/design-studio/design-contract.ts
COPY backend/src/modules/design-studio/design-render.ts /app/backend/src/modules/design-studio/design-render.ts
ARG VITE_SITE_URL
ARG VITE_API_BASE_URL=/api
ENV VITE_SITE_URL=$VITE_SITE_URL VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN test -n "$VITE_SITE_URL" && npm run build && npm run build:server

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production STOREFRONT_PORT=3104 STOREFRONT_HOST=0.0.0.0
COPY --from=build /app/frontend/customer-portal/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts
COPY --from=build /app/frontend/customer-portal/dist ./dist
COPY --from=build /app/frontend/customer-portal/server-build ./server-build
COPY --from=build /app/frontend/customer-portal/scripts/serve.mjs ./scripts/serve.mjs
USER node
EXPOSE 3104
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- http://127.0.0.1:3104/health || exit 1
CMD ["node", "scripts/serve.mjs"]
