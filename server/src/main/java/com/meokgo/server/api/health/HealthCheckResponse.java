package com.meokgo.server.api.health;

public record HealthCheckResponse(
        String status,
        String deviceKey
) {
}
