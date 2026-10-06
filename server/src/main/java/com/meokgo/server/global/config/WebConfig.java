package com.meokgo.server.global.config;

import com.meokgo.server.global.web.DeviceKeyArgumentResolver;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final DeviceKeyArgumentResolver deviceKeyArgumentResolver;
    private final List<String> allowedOrigins;

    public WebConfig(
            DeviceKeyArgumentResolver deviceKeyArgumentResolver,
            @Value("${app.cors.allowed-origins:http://localhost:3000}") String allowedOrigins
    ) {
        this.deviceKeyArgumentResolver = deviceKeyArgumentResolver;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(deviceKeyArgumentResolver);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}
