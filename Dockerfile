# syntax=docker/dockerfile:1
# Imagem unica: app Angular (PWA) servido pelo Spring Boot no mesmo dominio da API.

# ---------- 1. frontend
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build --configuration production

# ---------- 2. backend (+ frontend em classpath:/static)
FROM eclipse-temurin:21-jdk-alpine AS api
WORKDIR /api
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY backend/src src
COPY --from=web /web/dist/frontend/browser/ src/main/resources/static/
RUN ./mvnw -B -q -DskipTests package && cp target/*.jar app.jar

# ---------- 3. runtime
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=api /api/app.jar app.jar
USER app
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC" \
    EXPOSE_RESET_TOKEN=false
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD wget -qO- http://localhost:${PORT:-8080}/actuator/health || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
