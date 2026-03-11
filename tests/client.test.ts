// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file tests/client.test.ts
 * @brief AevumClient integration tests
 */

describe("AevumClient", () => {
  describe("Constructor", () => {
    it("should use default configuration", () => {
      const { AevumClient } = require("../src/index");
      const client = new AevumClient();
      expect(client).toBeDefined();
    });

    it("should accept custom configuration", () => {
      const { AevumClient } = require("../src/index");
      const client = new AevumClient({
        host: "localhost",
        port: 55002,
        apiKey: "test-key",
        poolSize: 5,
      });
      expect(client).toBeDefined();
    });
  });

  describe("Type exports", () => {
    it("should export all types", () => {
      const {
        AevumUserRole,
        QueryFilter,
        FindOptions,
        InsertResult,
        UpdateResult,
      } = require("../src/index");

      expect(AevumUserRole.ADMIN).toBe("ADMIN");
      expect(AevumUserRole.READ_ONLY).toBe("READ_ONLY");
      expect(AevumUserRole.READ_WRITE).toBe("READ_WRITE");
    });
  });

  describe("Error exports", () => {
    it("should export all error classes", () => {
      const {
        AevumError,
        AevumConnectionError,
        AevumAuthError,
        AevumTimeoutError,
        AevumOperationError,
      } = require("../src/index");

      expect(new AevumError("test", "TEST")).toBeInstanceOf(Error);
      expect(new AevumConnectionError("test")).toBeInstanceOf(AevumError);
      expect(new AevumAuthError()).toBeInstanceOf(AevumError);
    });
  });
});
