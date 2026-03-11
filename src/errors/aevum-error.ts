// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/errors/aevum-error.ts
 * @brief Custom error classes for AevumDB operations
 */

/**
 * Base class for all AevumDB errors
 */
export class AevumError extends Error {
  /**
   * @param message Error description
   * @param code Optional error code from server
   */
  constructor(
    message: string,
    readonly code: string = "AEVUM_ERROR",
  ) {
    super(message);
    this.name = "AevumError";
    Object.setPrototypeOf(this, AevumError.prototype);
  }
}

/**
 * Connection-related errors
 */
export class AevumConnectionError extends AevumError {
  constructor(message: string) {
    super(message, "CONNECTION_ERROR");
    this.name = "AevumConnectionError";
    Object.setPrototypeOf(this, AevumConnectionError.prototype);
  }
}

/**
 * Authentication/authorization errors
 */
export class AevumAuthError extends AevumError {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTH_ERROR");
    this.name = "AevumAuthError";
    Object.setPrototypeOf(this, AevumAuthError.prototype);
  }
}

/**
 * Query/operation validation errors
 */
export class AevumValidationError extends AevumError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "AevumValidationError";
    Object.setPrototypeOf(this, AevumValidationError.prototype);
  }
}

/**
 * Not found (document, collection, etc.)
 */
export class AevumNotFoundError extends AevumError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND");
    this.name = "AevumNotFoundError";
    Object.setPrototypeOf(this, AevumNotFoundError.prototype);
  }
}

/**
 * Protocol parsing or format errors
 */
export class AevumProtocolError extends AevumError {
  constructor(message: string) {
    super(message, "PROTOCOL_ERROR");
    this.name = "AevumProtocolError";
    Object.setPrototypeOf(this, AevumProtocolError.prototype);
  }
}

/**
 * Server-side operation errors
 */
export class AevumOperationError extends AevumError {
  constructor(message: string, code: string = "OPERATION_ERROR") {
    super(message, code);
    this.name = "AevumOperationError";
    Object.setPrototypeOf(this, AevumOperationError.prototype);
  }
}

/**
 * Timeout errors
 */
export class AevumTimeoutError extends AevumError {
  constructor(message: string = "Operation timeout") {
    super(message, "TIMEOUT");
    this.name = "AevumTimeoutError";
    Object.setPrototypeOf(this, AevumTimeoutError.prototype);
  }
}
