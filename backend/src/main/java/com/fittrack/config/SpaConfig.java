package com.fittrack.config;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serve o app Angular (copiado para classpath:/static no build Docker) no mesmo dominio da API.
 * Rotas do SPA (ex.: /treinos/3/editar) devolvem index.html; arquivos com hash ficam em cache longo,
 * enquanto index.html, manifesto e service worker nunca ficam em cache.
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    private static final ClassPathResource INDEX = new ClassPathResource("/static/index.html");

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/*.js", "/*.css", "/media/**")
                .addResourceLocations("classpath:/static/", "classpath:/static/media/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noCache())
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String path, Resource location) throws IOException {
                        Resource requested = location.createRelative(path);
                        if (requested.exists() && requested.isReadable()) return requested;
                        // API, actuator e arquivos inexistentes continuam 404
                        if (path.startsWith("api/") || path.startsWith("actuator/") || path.contains(".")) return null;
                        return INDEX.exists() ? INDEX : null;
                    }
                });
    }
}
