FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ../server/prisma ./prisma/
RUN npx prisma generate

COPY . .

CMD ["npm", "run", "dev"]
