package com.fittrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FittrackBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FittrackBackendApplication.class, args);
    }
}
