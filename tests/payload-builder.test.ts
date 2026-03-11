// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file tests/payload-builder.test.ts
 * @brief PayloadBuilder utility tests
 */

import { PayloadBuilder } from "../src/utils/payload-builder";
import { AevumValidationError } from "../src/errors/aevum-error";
import type { FindOptions } from "../src/types/index";

describe("PayloadBuilder", () => {
  const apiKey = "test-api-key";
  const collection = "users";

  describe("validateCollection", () => {
    it("should throw error for empty collection name", () => {
      expect(() => PayloadBuilder.insert(apiKey, "", { name: "test" })).toThrow(
        AevumValidationError,
      );
    });

    it("should throw error for whitespace-only collection name", () => {
      expect(() => PayloadBuilder.insert(apiKey, "   ", { name: "test" })).toThrow(
        AevumValidationError,
      );
    });

    it("should throw error for null collection name", () => {
      expect(() => PayloadBuilder.insert(apiKey, null as any, { name: "test" })).toThrow(
        AevumValidationError,
      );
    });
  });

  describe("insert", () => {
    it("should build insert payload correctly", () => {
      const doc = { name: "John", age: 30 };
      const payload = PayloadBuilder.insert(apiKey, collection, doc);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("insert");
      expect(payload.collection).toBe(collection);
      expect(payload.data).toEqual(doc);
    });

    it("should handle empty object insert", () => {
      const payload = PayloadBuilder.insert(apiKey, collection, {});

      expect(payload.action).toBe("insert");
      expect(payload.data).toEqual({});
    });
  });

  describe("find", () => {
    it("should build find payload with query and options", () => {
      const query = { age: { $gte: 21 } };
      const options: FindOptions = { limit: 10, skip: 5, sort: { name: 1 as 1 | -1 } };
      const payload = PayloadBuilder.find(apiKey, collection, query, options);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("find");
      expect(payload.collection).toBe(collection);
      expect(payload.query).toEqual(query);
      expect(payload.limit).toBe(10);
      expect(payload.skip).toBe(5);
      expect(payload.sort).toEqual({ name: 1 });
    });

    it("should build find payload with default options", () => {
      const payload = PayloadBuilder.find(apiKey, collection);

      expect(payload.action).toBe("find");
      expect(payload.query).toEqual({});
      expect(payload.limit).toBeUndefined();
      expect(payload.skip).toBeUndefined();
      expect(payload.sort).toBeUndefined();
    });

    it("should build find payload with only query", () => {
      const query = { status: "active" };
      const payload = PayloadBuilder.find(apiKey, collection, query);

      expect(payload.query).toEqual(query);
    });
  });

  describe("update", () => {
    it("should build update payload correctly", () => {
      const query = { _id: "123" };
      const update = { age: 31, updated_at: new Date().toISOString() };
      const payload = PayloadBuilder.update(apiKey, collection, query, update);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("update");
      expect(payload.collection).toBe(collection);
      expect(payload.query).toEqual(query);
      expect(payload.data).toEqual(update);
    });
  });

  describe("delete", () => {
    it("should build delete payload correctly", () => {
      const query = { _id: "123" };
      const payload = PayloadBuilder.delete(apiKey, collection, query);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("delete");
      expect(payload.collection).toBe(collection);
      expect(payload.query).toEqual(query);
    });

    it("should build delete payload with complex query", () => {
      const query = { status: "deleted", age: { $lt: 18 } };
      const payload = PayloadBuilder.delete(apiKey, collection, query);

      expect(payload.query).toEqual(query);
    });
  });

  describe("count", () => {
    it("should build count payload correctly", () => {
      const query = { status: "active" };
      const payload = PayloadBuilder.count(apiKey, collection, query);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("count");
      expect(payload.collection).toBe(collection);
      expect(payload.query).toEqual(query);
    });

    it("should build count payload with empty query", () => {
      const payload = PayloadBuilder.count(apiKey, collection);

      expect(payload.query).toEqual({});
    });
  });

  describe("setSchema", () => {
    it("should build set_schema payload correctly", () => {
      const schema = {
        title: "User",
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      };
      const payload = PayloadBuilder.setSchema(apiKey, collection, schema);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("set_schema");
      expect(payload.collection).toBe(collection);
      expect(payload.schema).toEqual(schema);
    });
  });

  describe("createUser", () => {
    it("should build create_user payload correctly", () => {
      const userKey = "new-user-123";
      const role = "READ_WRITE";
      const payload = PayloadBuilder.createUser(apiKey, userKey, role);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("create_user");
      expect(payload.key).toBe(userKey);
      expect(payload.role).toBe(role);
    });

    it("should handle different roles", () => {
      const roles = ["READ_ONLY", "READ_WRITE", "ADMIN"];

      roles.forEach((role) => {
        const payload = PayloadBuilder.createUser(apiKey, "test-user", role);
        expect(payload.role).toBe(role);
      });
    });
  });

  describe("exit", () => {
    it("should build exit payload correctly", () => {
      const payload = PayloadBuilder.exit(apiKey);

      expect(payload.auth).toBe(apiKey);
      expect(payload.action).toBe("quit");
      expect(Object.keys(payload)).toEqual(["auth", "action"]);
    });
  });

  describe("serialize", () => {
    it("should serialize payload to JSON string", () => {
      const payload = PayloadBuilder.insert(apiKey, collection, { test: true });
      const serialized = PayloadBuilder.serialize(payload);

      expect(typeof serialized).toBe("string");
      expect(() => JSON.parse(serialized)).not.toThrow();

      const parsed = JSON.parse(serialized);
      expect(parsed.auth).toBe(apiKey);
      expect(parsed.action).toBe("insert");
    });

    it("should handle complex nested objects", () => {
      const payload = PayloadBuilder.find(apiKey, collection, {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
      });
      const serialized = PayloadBuilder.serialize(payload);

      const parsed = JSON.parse(serialized);
      expect(parsed.query.nested.deep.value).toBe(42);
      expect(parsed.query.array).toEqual([1, 2, 3]);
    });
  });

  describe("Complex query operations", () => {
    it("should handle comparison operators", () => {
      const queries = [
        { age: { $gt: 18 } },
        { age: { $gte: 21 } },
        { age: { $lt: 65 } },
        { age: { $lte: 60 } },
        { age: { $eq: 30 } },
        { age: { $ne: 0 } },
      ];

      queries.forEach((query) => {
        const payload = PayloadBuilder.find(apiKey, collection, query);
        expect(payload.query).toEqual(query);
      });
    });

    it("should handle array operators", () => {
      const queries = [
        { tags: { $in: ["javascript", "typescript"] } },
        { tags: { $nin: ["deprecated", "archived"] } },
      ];

      queries.forEach((query) => {
        const payload = PayloadBuilder.find(apiKey, collection, query);
        expect(payload.query).toEqual(query);
      });
    });

    it("should handle combined conditions", () => {
      const query = {
        age: { $gte: 18, $lte: 65 },
        status: { $in: ["active", "pending"] },
        name: { $ne: null },
      };
      const payload = PayloadBuilder.find(apiKey, collection, query);

      expect(payload.query).toEqual(query);
    });
  });
});
