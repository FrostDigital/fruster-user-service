FROM node:20.9.0-alpine

RUN apk add --update bash && rm -rf /var/cache/apk/*

WORKDIR /app
ADD . .

RUN npm install
EXPOSE 3200

CMD ["node", "app.js"]
