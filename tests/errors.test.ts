// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file tests/errors.test.ts
 * @brief Error class and handling tests
 */

describe("AevumError", () => {
  it("should create error with message and code", () => {
    const { AevumError } = require("../src/index");
    const error = new AevumError("Test message", "TEST_CODE");

    expect(error.message).toBe("Test message");
    expect(error.code).toBe("TEST_CODE");
    expect(error.name).toBe("AevumError");
  });

  it("should have correct inheritance chain", () => {
    const { AevumConnectionError, AevumError } = require("../src/index");
    const error = new AevumConnectionError("Connection failed");

    expect(error).toBeInstanceOf(AevumConnectionError);
    expect(error).toBeInstanceOf(AevumError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("Error Classes", () => {
  const errorClasses = [
    "AevumError",
    "AevumConnectionError",
    "AevumAuthError",
    "AevumValidationError",
    "AevumNotFoundError",
    "AevumProtocolError",
    "AevumOperationError",
    "AevumTimeoutError",
  ];

  errorClasses.forEach((className) => {
    it(`should properly instantiate ${className}`, () => {
      const { [className]: ErrorClass } = require("../src/index");
      const error = new ErrorClass("Test error");

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(className);
      expect(error.message).toBe("Test error");
    });
  });
});
