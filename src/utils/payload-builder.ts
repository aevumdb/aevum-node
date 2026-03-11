// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/utils/payload-builder.ts
 * @brief Builds and sends AevumDB protocol payloads
 */

import { AevumPayload, QueryFilter, FindOptions, SchemaDefinition } from "../types/index";
import { AevumValidationError } from "../errors/aevum-error";

/**
 * Payload construction utility
 */
export class PayloadBuilder {
  /**
   * Validates collection name
   * @param collection Collection identifier
   * @throws {AevumValidationError} if invalid
   */
  private static validateCollection(collection: string): void {
    if (!collection || typeof collection !== "string" || collection.trim() === "") {
      throw new AevumValidationError("Collection name must be a non-empty string");
    }
  }

  /**
   * Builds insert payload
   */
  static insert(apiKey: string, collection: string, document: Record<string, any>): AevumPayload {
    this.validateCollection(collection);
    return {
      auth: apiKey,
      action: "insert",
      collection,
      data: document,
    };
  }

  /**
   * Builds find payload
   */
  static find(
    apiKey: string,
    collection: string,
    query: QueryFilter = {},
    options: FindOptions = {},
  ): AevumPayload {
    this.validateCollection(collection);
    return {
      auth: apiKey,
      action: "find",
      collection,
      query,
      sort: options.sort,
      limit: options.limit,
      skip: options.skip,
    };
  }

  /**
   * Builds update payload
   */
  static update(
    apiKey: string,
    collection: string,
    query: QueryFilter,
    update: Record<string, any>,
  ): AevumPayload {
    this.validateCollection(collection);
    return {
      auth: apiKey,
      action: "update",
      collection,
      query,
      data: update,
    };
  }

  /**
   * Builds delete payload
   */
  static delete(apiKey: string, collection: string, query: QueryFilter): AevumPayload {
    this.validateCollection(collection);
    return {
      auth: apiKey,
      action: "delete",
      collection,
      query,
    };
  }

  /**
   * Builds count payload
   */
  static count(apiKey: string, collection: string, query: QueryFilter = {}): AevumPayload {
    this.validateCollection(collection);
    return {
      auth: apiKey,
      action: "count",
      collection,
      query,
    };
  }

  /**
   * Builds set_schema payload
   */
  static setSchema(apiKey: string, collection: string, schema: SchemaDefinition): AevumPayload {
    this.validateCollection(collection);
    return {
      auth: apiKey,
      action: "set_schema",
      collection,
      schema,
    };
  }

  /**
   * Builds create_user payload
   */
  static createUser(apiKey: string, userKey: string, role: string): AevumPayload {
    return {
      auth: apiKey,
      action: "create_user",
      key: userKey,
      role,
    };
  }

  /**
   * Builds exit payload
   */
  static exit(apiKey: string): AevumPayload {
    return {
      auth: apiKey,
      action: "quit",
    };
  }

  /**
   * Serializes payload to JSON string
   */
  static serialize(payload: AevumPayload): string {
    return JSON.stringify(payload);
  }
}
