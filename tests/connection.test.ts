// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file tests/connection.test.ts
 * @brief Socket and connection pool tests
 */

import { AevumSocket } from "../src/connection/socket";
import { ConnectionPool } from "../src/connection/pool";
import { AevumConnectionError, AevumTimeoutError } from "../src/errors/aevum-error";

describe("AevumSocket", () => {
  let socket: AevumSocket;
  const host = "localhost";
  const port = 55001;

  beforeEach(() => {
    socket = new AevumSocket(host, port, 5000, 0);
  });

  describe("Constructor", () => {
    it("should initialize with default timeouts", () => {
      const socket = new AevumSocket(host, port);
      expect(socket).toBeDefined();
      expect(socket.isConnected).toBe(false);
    });

    it("should initialize with custom timeouts", () => {
      const socket = new AevumSocket(host, port, 10000, 5000);
      expect(socket).toBeDefined();
      expect(socket.isConnected).toBe(false);
    });
  });

  describe("isConnected getter", () => {
    it("should return false when not connected", () => {
      expect(socket.isConnected).toBe(false);
    });
  });

  describe("Socket state management", () => {
    it("should initialize as not connected", () => {
      expect(socket.isConnected).toBe(false);
    });

    it("should handle destroy operation", () => {
      socket.destroy();
      expect(socket.isConnected).toBe(false);
    });
  });

  describe("Error creation", () => {
    it("should handle connection errors", () => {
      const error = new AevumConnectionError("Connection failed");
      expect(error).toBeInstanceOf(AevumConnectionError);
      expect(error.message).toBe("Connection failed");
    });

    it("should handle timeout errors", () => {
      const error = new AevumTimeoutError("Query timeout");
      expect(error).toBeInstanceOf(AevumTimeoutError);
      expect(error.message).toBe("Query timeout");
    });
  });
});

describe("ConnectionPool", () => {
  let pool: ConnectionPool;
  const host = "localhost";
  const port = 55001;
  const poolSize = 5;

  beforeEach(() => {
    pool = new ConnectionPool(poolSize, host, port, 5000, 0);
  });

  afterEach(() => {
    pool.destroy();
  });

  describe("Constructor", () => {
    it("should initialize with correct configuration", () => {
      const newPool = new ConnectionPool(10, host, port, 10000, 5000);
      expect(newPool).toBeDefined();
      expect(newPool.getStats()).toBeDefined();
    });

    it("should use default timeouts", () => {
      const newPool = new ConnectionPool(5, host, port);
      expect(newPool).toBeDefined();
    });

    it("should throw error for invalid pool size", () => {
      expect(() => new ConnectionPool(0, host, port)).toThrow(AevumConnectionError);
    });

    it("should throw error for negative pool size", () => {
      expect(() => new ConnectionPool(-5, host, port)).toThrow(AevumConnectionError);
    });
  });

  describe("getStats", () => {
    it("should return pool statistics", () => {
      const stats = pool.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.available).toBe("number");
      expect(typeof stats.inUse).toBe("number");
      expect(typeof stats.waiting).toBe("number");
    });

    it("should return stats with non-negative values", () => {
      const stats = pool.getStats();
      expect(stats.available).toBeGreaterThanOrEqual(0);
      expect(stats.inUse).toBeGreaterThanOrEqual(0);
      expect(stats.waiting).toBeGreaterThanOrEqual(0);
    });
  });

  describe("destroy", () => {
    it("should destroy pool and all connections", () => {
      pool.destroy();
      const stats = pool.getStats();
      expect(stats.available).toBe(0);
      expect(stats.inUse).toBe(0);
      expect(stats.waiting).toBe(0);
    });

    it("should reset stats after destroy", () => {
      pool.destroy();
      const statsAfter = pool.getStats();

      expect(statsAfter.available).toBe(0);
      expect(statsAfter.inUse).toBe(0);
      expect(statsAfter.waiting).toBe(0);
    });
  });

  describe("Pool initialization", () => {
    it("should initialize with correct size constraint", () => {
      const stats = pool.getStats();
      expect(stats.available + stats.inUse).toBeLessThanOrEqual(poolSize);
    });
  });

  describe("Queue management", () => {
    it("should handle queue state correctly", () => {
      const stats = pool.getStats();
      // Total of available + inUse + waiting should match expected state
      const total = stats.available + stats.inUse + stats.waiting;
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Connection Pool Behavior", () => {
  it("should handle multiple pools independently", () => {
    const pool1 = new ConnectionPool(5, "localhost", 55001);
    const pool2 = new ConnectionPool(3, "localhost", 55002);

    const stats1 = pool1.getStats();
    const stats2 = pool2.getStats();

    expect(stats1).toBeDefined();
    expect(stats2).toBeDefined();

    pool1.destroy();
    pool2.destroy();
  });

  it("should handle pool configuration variations", () => {
    const configs = [
      { size: 1, host: "localhost", port: 55001 },
      { size: 5, host: "localhost", port: 55001 },
      { size: 10, host: "localhost", port: 55001 },
      { size: 20, host: "localhost", port: 55001 },
    ];

    configs.forEach(({ size, host, port }) => {
      const testPool = new ConnectionPool(size, host, port);
      expect(testPool.getStats()).toBeDefined();
      testPool.destroy();
    });
  });
});
