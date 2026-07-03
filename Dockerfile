FROM node:26-alpine

RUN apk add --update bash && rm -rf /var/cache/apk/*

WORKDIR /app
ADD . .

RUN npm install
RUN npm run build
EXPOSE 3200

CMD ["npm", "run", "start:dist"]
