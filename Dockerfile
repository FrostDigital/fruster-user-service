FROM node:26-alpine

RUN apk add --update --no-cache curl && rm -rf /var/cache/apk/*

WORKDIR /app
ADD . .

ENV NODE_OPTIONS=--no-experimental-strip-types

RUN npm install
RUN npm run build

EXPOSE 3200

CMD ["npm", "run", "start:dist"]
