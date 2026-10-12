FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . ./
RUN pnpm build

FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.generated/nginx/html /usr/share/nginx/html
COPY --from=build /app/.generated/nginx/headers.conf /etc/nginx/includes/headers.conf
COPY --from=build /app/.generated/nginx/locations.conf /etc/nginx/includes/locations.conf

EXPOSE 80
