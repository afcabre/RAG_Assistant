FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json /app/backend/
WORKDIR /app/backend
RUN npm ci

COPY backend /app/backend
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]

