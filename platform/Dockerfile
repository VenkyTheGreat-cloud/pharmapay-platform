FROM node:18-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/
COPY database/ ./database/

RUN mkdir -p uploads logs

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
