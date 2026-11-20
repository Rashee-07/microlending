package com.aaseya.microlending;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

import io.camunda.zeebe.spring.client.annotation.Deployment;

/**
 * MicroLending backend. Deploys every BPMN and DMN file in src/main/resources/model to Zeebe on startup.
 *
 * Layers: controller -> service -> dao (Postgres) / integration (external systems);
 * worker = Zeebe job workers that call the services.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@Deployment(resources = "classpath*:/model/*.*")
public class MicroLendingApplication {

  public static void main(String[] args) {
    SpringApplication.run(MicroLendingApplication.class, args);
  }
}
