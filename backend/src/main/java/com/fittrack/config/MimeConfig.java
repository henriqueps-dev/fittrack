package com.fittrack.config;

import org.springframework.boot.web.server.MimeMappings;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.server.servlet.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Configuration;

/** Tipos MIME exigidos pelo PWA (manifesto) e pelo modelo 3D. */
@Configuration
public class MimeConfig implements WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> {

    @Override
    public void customize(ConfigurableServletWebServerFactory factory) {
        MimeMappings mappings = new MimeMappings(MimeMappings.DEFAULT);
        mappings.add("webmanifest", "application/manifest+json");
        mappings.add("glb", "model/gltf-binary");
        factory.setMimeMappings(mappings);
    }
}
