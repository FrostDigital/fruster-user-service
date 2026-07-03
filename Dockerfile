FROM node:20.9.0-alpine

RUN apk add --update bash && rm -rf /var/cache/apk/*

WORKDIR /app
ADD . .

RUN npm install
RUN npm run build
EXPOSE 3200

CMD ["npm", "run", "start:dist"]
