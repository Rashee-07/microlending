package com.aaseya.microlending.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aaseya.microlending.dto.response.ErrorResponse;
import com.aaseya.microlending.exception.AccessDeniedException;
import com.aaseya.microlending.exception.AuthenticationFailedException;
import com.aaseya.microlending.exception.BusinessException;
import com.aaseya.microlending.exception.NotFoundException;
import com.aaseya.microlending.exception.TaskNotActiveException;

/** Maps exceptions to HTTP status codes with a {"message": "..."} body. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger LOG = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler({BusinessException.class, IllegalArgumentException.class})
  public ResponseEntity<ErrorResponse> badRequest(RuntimeException e) {
    return error(HttpStatus.BAD_REQUEST, e.getMessage());
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> unreadable(HttpMessageNotReadableException e) {
    return error(HttpStatus.BAD_REQUEST, "Invalid request body: " + e.getMostSpecificCause().getMessage());
  }

  @ExceptionHandler(AuthenticationFailedException.class)
  public ResponseEntity<ErrorResponse> unauthorized(AuthenticationFailedException e) {
    return error(HttpStatus.UNAUTHORIZED, e.getMessage());
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> forbidden(AccessDeniedException e) {
    return error(HttpStatus.FORBIDDEN, e.getMessage());
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResponse> notFound(NotFoundException e) {
    return error(HttpStatus.NOT_FOUND, e.getMessage());
  }

  @ExceptionHandler(TaskNotActiveException.class)
  public ResponseEntity<ErrorResponse> conflict(TaskNotActiveException e) {
    return error(HttpStatus.CONFLICT, e.getMessage());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> unexpected(Exception e) {
    LOG.error("Unexpected error", e);
    return error(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong: " + e.getMessage());
  }

  private static ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(new ErrorResponse(message));
  }
}
