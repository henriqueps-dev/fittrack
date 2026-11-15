package com.fittrack.exception;

import org.springframework.http.HttpStatus;

/** Violacao de regra de negocio com status HTTP associado. */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
