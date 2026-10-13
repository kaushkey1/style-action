FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY config.cjs server.cjs ./
COPY ci-test.sh ./
EXPOSE 80
CMD ["node", "server.cjs"]
