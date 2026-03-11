// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/types/index.ts
 * @brief Complete type definitions for AevumDB Node.js driver
 */

/**
 * Connection configuration options
 */
export interface AevumConnectionConfig {
  /** Target server hostname (default: '127.0.0.1') */
  host?: string;
  /** Target server port (default: 55001) */
  port?: number;
  /** API authentication key (default: 'root') */
  apiKey?: string;
  /** Connection pool size for concurrent operations (0 = single socket) */
  poolSize?: number;
  /** Connection timeout in milliseconds (default: 5000) */
  connectTimeout?: number;
  /** Query timeout in milliseconds (0 = no timeout) */
  queryTimeout?: number;
}

/**
 * Standard API response envelope
 */
export interface AevumResponse<T = any> {
  /** Operation status: 'success', 'ok', or 'error' */
  status: "success" | "ok" | "error";
  /** Human-readable message */
  message?: string;
  /** Operation result data (dependent on operation) */
  data?: T;
  /** Error details if status is 'error' */
  error?: {
    code: string;
    details?: string;
  };
  /** Top-level fields returned by some actions */
  [key: string]: any;
}

/**
 * Document with generated ID
 */
export interface AevumDocument {
  /** Auto-generated UUID v4 */
  _id: string;
  /** User-provided fields */
  [key: string]: any;
}

/**
 * Query operators for filtering documents
 */
export interface QueryOperators {
  /** Greater than comparison */
  $gt?: any;
  /** Greater than or equal comparison */
  $gte?: any;
  /** Less than comparison */
  $lt?: any;
  /** Less than or equal comparison */
  $lte?: any;
  /** Equality check */
  $eq?: any;
  /** Not equal check */
  $ne?: any;
  /** Value in array */
  $in?: any[];
  /** Value not in array */
  $nin?: any[];
}

/**
 * Query filter object
 */
export type QueryFilter = {
  [key: string]: any | QueryOperators;
};

/**
 * Find operation options
 */
export interface FindOptions {
  /** Sort specification: {field: 1} ascending, -1 descending */
  sort?: Record<string, 1 | -1>;
  /** Maximum documents to return (0 = no limit) */
  limit?: number;
  /** Skip number of documents (pagination offset) */
  skip?: number;
  /** Field projection (future enhancement) */
  projection?: Record<string, 0 | 1>;
}

/**
 * Insert operation result
 */
export interface InsertResult {
  /** Generated document ID */
  _id: string;
}

/**
 * Update operation result
 */
export interface UpdateResult {
  /** Number of documents modified */
  updated_count: number;
}

/**
 * Delete operation result
 */
export interface DeleteResult {
  /** Number of documents removed */
  deleted_count: number;
}

/**
 * Count operation result
 */
export interface CountResult {
  /** Total matching documents */
  count: number;
}

/**
 * Schema validation definition
 */
export interface SchemaDefinition {
  /** JSON Schema format validation rules */
  [key: string]: any;
}

/**
 * Set schema operation result
 */
export interface SetSchemaResult {
  /** Operation status message */
  status: string;
}

/**
 * User role in RBAC model
 */
export enum AevumUserRole {
  /** Read-only access: find, count */
  READ_ONLY = "READ_ONLY",
  /** Read-write: find, count, insert, update, delete, set_schema */
  READ_WRITE = "READ_WRITE",
  /** Full access: all operations */
  ADMIN = "ADMIN",
}

/**
 * Create user operation result
 */
export interface CreateUserResult {
  /** Operation status message */
  status: string;
}

/**
 * Internal payload structure for protocol
 */
export interface AevumPayload {
  auth: string;
  action: string;
  collection?: string;
  data?: any;
  query?: QueryFilter;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  schema?: SchemaDefinition;
  role?: string;
  key?: string;
}
