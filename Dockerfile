FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm install

COPY . .

EXPOSE 2342

# Aqui a mágica acontece pós-montagem de volume
CMD ["npm", "run", "start:dev"]