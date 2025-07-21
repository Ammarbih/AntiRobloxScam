FROM node:20-slim

WORKDIR /app

# Kopieer package.json en package-lock.json
COPY package*.json ./

# Installeer projectafhankelijkheden
RUN npm install --production

# Kopieer de rest van de applicatiecode
COPY . .

# Verwijder de lokale SQLite database (niet nodig voor Postgres)
RUN rm -f database.db

# Stel de poort in waar de applicatie op luistert
ENV PORT 5000
EXPOSE 5000

# Start de applicatie
CMD ["node", "server.js"] 