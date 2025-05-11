# Estágio de build
FROM node:18-alpine AS build

# Diretório de trabalho
WORKDIR /app

# Copiar apenas arquivos de dependências para aproveitar o cache do Docker
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Estágio de produção
FROM node:18-alpine

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Diretório de trabalho
WORKDIR /app

# Copiar apenas as dependências do estágio de build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Copiar código-fonte
COPY src ./src

# Expor a porta da aplicação
EXPOSE 3001

# Executar a aplicação
CMD ["node", "src/server.js"]