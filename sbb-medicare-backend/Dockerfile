FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY database/ ./database/

RUN mkdir -p uploads logs

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
