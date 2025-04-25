FROM node:22-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY ./web .

ARG BASE_URL
RUN echo "VITE_BUILD_BASE=$BASE_URL" > .env
RUN sed -i "s|/api|$BASE_URL/api|g" config.toml

RUN pnpm install --frozen-lockfile
RUN pnpm build

# ---

FROM oven/bun:1-alpine AS runtime

WORKDIR /app
COPY . .
RUN rm -rf web nginx.conf start.sh

# install backend dependencies
RUN bun install --frozen-lockfile --production

# config.toml
RUN mv config.docker.toml config.default.toml

# ---

FROM oven/bun:1-alpine

# install nginx
WORKDIR /
RUN apk add --no-cache nginx
RUN mkdir -p /run/nginx
RUN mkdir -p /var/www/html
RUN rm -rf /etc/nginx/conf.d
RUN rm -rf /etc/nginx/nginx.conf
RUN rm -rf /var/www/html/*
RUN rm -rf /var/www/localhost

# copy backend and frontend files
WORKDIR /app
COPY --from=runtime /app /app
COPY --from=builder /app/dist /var/www/html
RUN chown -R nginx:nginx /var/www/html

# config.toml
RUN mkdir -p /data
RUN cp config.default.toml /data/config.toml
RUN ln -s /data/config.toml config.toml

# copy configuration and start script
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# modify nginx config
ARG BASE_URL
RUN [ -n "$BASE_URL" ] && sed -i "s|location __BASE_URL__ |location $BASE_URL |g" /etc/nginx/nginx.conf || \
      sed -i "s|location __BASE_URL__ |location / |g" /etc/nginx/nginx.conf
RUN sed -i "s|location /api |location $BASE_URL/api |g" /etc/nginx/nginx.conf

ENV NODE_ENV=production
CMD [ "/usr/local/bin/start.sh" ]

EXPOSE 80