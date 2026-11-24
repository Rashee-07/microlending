# MicroLending backend (Spring Boot + Zeebe workers)
#   docker build -t microlending-backend .
#   docker run -p 8898:8898 -e ZEEBE_ADDRESS=... -e DB_URL=... microlending-backend
# Settings are environment variables, see src/main/resources/application.properties
# (ZEEBE_ADDRESS, DB_URL, DB_USER, DB_PASSWORD, KEYCLOAK_TOKEN_URL, TASKLIST_URL, KEYCLOAK_URL,
#  MICROLENDING_CLIENT_ID, MICROLENDING_CLIENT_SECRET).

# ---- build ----
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /src
# Download dependencies first so they are cached until pom.xml changes
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
# Tests already run in the CI "backend" job
RUN mvn -B -q -DskipTests package

# ---- run ----
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN useradd --system --uid 10001 app
COPY --from=build /src/target/camunda-8-start-form-*.jar app.jar
USER app
EXPOSE 8898
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
