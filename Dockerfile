FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
COPY server ./server
COPY public ./public
COPY README.md ./

ENV PORT=4173
ENV MAX_UPLOAD_MB=2048
EXPOSE 4173

CMD ["node", "server/server.js"]
