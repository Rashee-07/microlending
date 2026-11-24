# MicroLending frontend (React production build served by scripts/serve-build.js)
#   docker build -t microlending-frontend --build-arg REACT_APP_API_URL=http://localhost:8898 .
#   docker run -p 3077:3077 microlending-frontend
# The backend URL is baked in at build time (Create React App), so build one image per environment.

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY public ./public
COPY src ./src
ARG REACT_APP_API_URL=http://localhost:8898
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# ---- run ----
FROM node:20-alpine
WORKDIR /app
COPY scripts ./scripts
COPY --from=build /app/build ./build
USER node
EXPOSE 3077
CMD ["node", "scripts/serve-build.js", "build", "3077"]
