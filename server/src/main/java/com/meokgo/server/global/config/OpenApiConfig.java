package com.meokgo.server.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String DEVICE_KEY_SCHEME = "X-Device-Key";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(localServer()))
                .components(new Components()
                        .addSecuritySchemes(DEVICE_KEY_SCHEME, deviceKeySecurityScheme()))
                .addSecurityItem(new SecurityRequirement().addList(DEVICE_KEY_SCHEME));
    }

    private Info apiInfo() {
        return new Info()
                .title("먹으러GO API 명세서")
                .description("""
                        React Native 호스트 앱과 React 웹 참여자 페이지가 공통으로 사용하는 Spring Boot API입니다.
                        MVP에서는 로그인 없이 X-Device-Key 헤더로 기기 기반 사용자를 식별합니다.
                        """)
                .version("v1")
                .license(new License().name("Private Project"));
    }

    private Server localServer() {
        return new Server()
                .url("http://localhost:8080")
                .description("Local server");
    }

    private SecurityScheme deviceKeySecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.HEADER)
                .name(DEVICE_KEY_SCHEME)
                .description("기기 기반 사용자 식별 키");
    }
}
