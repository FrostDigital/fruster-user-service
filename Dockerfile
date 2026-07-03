FROM node:26-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends libcurl4 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ADD . .

RUN npm install
RUN npm run build
EXPOSE 3200

CMD ["npm", "run", "start:dist"]
