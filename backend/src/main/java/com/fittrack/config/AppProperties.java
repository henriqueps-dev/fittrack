package com.fittrack.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Auth auth) {

    public record Jwt(String secret, long expirationHours) { }

    public record Cors(List<String> allowedOrigins) { }

    public record Auth(boolean exposeResetToken, String frontendUrl) { }
}
