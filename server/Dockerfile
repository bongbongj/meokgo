FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /workspace

COPY gradle gradle
COPY gradlew build.gradle settings.gradle ./
COPY src src

RUN chmod +x gradlew && ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-nanum \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mkdir -p /app/storage

COPY --from=builder /workspace/build/libs/*.jar /app/app.jar

ENV STORAGE_LOCAL_ROOT=/app/storage \
    STORY_FONT_FAMILY=NanumGothic

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
