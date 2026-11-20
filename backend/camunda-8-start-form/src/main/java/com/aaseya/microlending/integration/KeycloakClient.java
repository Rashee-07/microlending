package com.aaseya.microlending.integration;

import java.util.Base64;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.aaseya.microlending.exception.AuthenticationFailedException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Real Keycloak call: checks username/password (password grant, realm "microlending") and reads the token claims. */
@Component
public class KeycloakClient {

  private final RestTemplate rest = new RestTemplate();
  private final ObjectMapper json = new ObjectMapper();

  @Value("${login.keycloak.token-url}")
  private String tokenUrl;

  @Value("${login.keycloak.client-id}")
  private String clientId;

  /** Returns the claims of the access token, or throws when the credentials are wrong. */
  public JsonNode login(String username, String password) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("grant_type", "password");
    form.add("client_id", clientId);
    form.add("username", username);
    form.add("password", password);
    try {
      Map<?, ?> response = rest.postForObject(tokenUrl, new HttpEntity<>(form, headers), Map.class);
      return claims((String) response.get("access_token"));
    } catch (HttpClientErrorException e) {
      throw new AuthenticationFailedException("Invalid username or password");
    }
  }

  /** The middle part of the JWT is base64url-encoded JSON. */
  private JsonNode claims(String accessToken) {
    try {
      String payload = new String(Base64.getUrlDecoder().decode(accessToken.split("\\.")[1]));
      return json.readTree(payload);
    } catch (Exception e) {
      throw new AuthenticationFailedException("Could not read the Keycloak token");
    }
  }
}
