FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

# Use a simple wrapper to handle the stdio/http conversion for cloud hosting
CMD ["node", "server.js"]
