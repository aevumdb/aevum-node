// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/index.ts
 * @brief Main entry point - AevumDB Node.js driver
 */

import {
  AevumResponse,
  QueryFilter,
  FindOptions,
  InsertResult,
  UpdateResult,
  DeleteResult,
  CountResult,
  SetSchemaResult,
  CreateUserResult,
  AevumUserRole,
  SchemaDefinition,
  AevumConnectionConfig,
} from "./types/index";
import { AevumConnectionError, AevumAuthError, AevumOperationError } from "./errors/aevum-error";
import { AevumSocket } from "./connection/socket";
import { ConnectionPool } from "./connection/pool";
import { PayloadBuilder } from "./utils/payload-builder";
import { ICrudOperations } from "./operations/crud";
import { IAdminOperations } from "./admin/user-management";

/**
 * @class AevumClient
 * @brief Complete AevumDB driver
 * @details Supports single-socket and pooled connections for any workload.
 * Implements CRUD, querying, schema, and user management operations.
 *
 * @example
 * ```typescript
 * const client = new AevumClient({
 *   host: '127.0.0.1',
 *   port: 55001,
 *   apiKey: 'root',
 *   poolSize: 10
 * });
 *
 * await client.connect();
 * const result = await client.insert('users', { name: 'John', age: 30 });
 * const users = await client.find('users', { age: { $gt: 25 } });
 * await client.disconnect();
 * ```
 */
export class AevumClient implements ICrudOperations, IAdminOperations {
  private socket: AevumSocket | null = null;
  private pool: ConnectionPool | null = null;

  private readonly host: string;
  private readonly port: number;
  private readonly apiKey: string;
  private readonly poolSize: number;
  private readonly connectTimeout: number;
  private readonly queryTimeout: number;

  /**
   * Initializes client with connection configuration
   * @param config Connection parameters
   * @throws {AevumConnectionError} if poolSize is invalid
   */
  constructor(config: AevumConnectionConfig = {}) {
    this.host = config.host ?? "127.0.0.1";
    this.port = config.port ?? 55001;
    this.apiKey = config.apiKey ?? "root";
    this.poolSize = config.poolSize ?? 0;
    this.connectTimeout = config.connectTimeout ?? 5000;
    this.queryTimeout = config.queryTimeout ?? 0;

    if (this.poolSize > 0) {
      this.pool = new ConnectionPool(
        this.poolSize,
        this.host,
        this.port,
        this.connectTimeout,
        this.queryTimeout,
      );
    } else {
      this.socket = new AevumSocket(this.host, this.port, this.connectTimeout, this.queryTimeout);
    }
  }

  /**
   * Establishes connection to server
   * Initializes socket or connection pool
   * @throws {AevumConnectionError} if connection fails
   */
  public async connect(): Promise<void> {
    if (this.pool) {
      await this.pool.initialize();
    } else if (this.socket) {
      await this.socket.connect();
    }
  }

  /**
   * Disconnects from server and cleans up resources
   * Sends graceful exit command before closing sockets
   */
  public async disconnect(): Promise<void> {
    try {
      const exitPayload = PayloadBuilder.serialize(PayloadBuilder.exit(this.apiKey));
      if (this.socket && this.socket.isConnected) {
        await this.socket.send(exitPayload).catch(() => {});
      }
    } finally {
      if (this.pool) this.pool.destroy();
      if (this.socket) this.socket.destroy();
    }
  }

  /**
   * Internal method to execute operations
   * Routes through socket or pool depending on configuration
   */
  private async execute<T = any>(
    action: string,
    collection: string,
    payload: Record<string, any>,
  ): Promise<AevumResponse<T>> {
    let socket: AevumSocket | null = null;

    try {
      if (this.pool) {
        socket = await this.pool.acquire();
      } else if (this.socket) {
        socket = this.socket;
      } else {
        throw new AevumConnectionError("Client not connected");
      }

      const requestPayload = {
        auth: this.apiKey,
        action,
        collection,
        ...payload,
      };

      const response = await socket.send(JSON.stringify(requestPayload));
      const parsed = JSON.parse(response) as AevumResponse<T>;

      if (parsed.status === "error") {
        const code = parsed.error?.code ?? "UNKNOWN_ERROR";
        const msg = parsed.error?.details ?? parsed.message ?? "Unknown error";

        if (code === "AUTH_ERROR") throw new AevumAuthError(msg);
        if (code === "NOT_FOUND") throw new AevumOperationError(msg, code);
        throw new AevumOperationError(msg, code);
      }

      // Map top-level results to data field if status is 'ok' or 'success'
      if (parsed.status === "ok" || parsed.status === "success") {
        if (!parsed.data) {
          const { status: _status, message: _message, ...rest } = parsed;
          if (Object.keys(rest).length > 0) {
            parsed.data = rest as unknown as T;
          }
        }
      }

      return parsed;
    } finally {
      if (this.pool && socket) {
        this.pool.release(socket);
      }
    }
  }

  /**
   * Inserts single document
   */
  public async insert(
    collection: string,
    document: Record<string, any>,
  ): Promise<AevumResponse<InsertResult>> {
    return this.execute("insert", collection, { data: document });
  }

  /**
   * Queries documents with optional filtering, sorting, pagination
   */
  public async find<T = any>(
    collection: string,
    query: QueryFilter = {},
    options: FindOptions = {},
  ): Promise<AevumResponse<T[]>> {
    const payload: any = { query };
    if (options.sort) payload.sort = options.sort;
    if (options.limit !== undefined) payload.limit = options.limit;
    if (options.skip !== undefined) payload.skip = options.skip;
    return this.execute("find", collection, payload);
  }

  /**
   * Updates documents matching filter
   */
  public async update(
    collection: string,
    query: QueryFilter,
    update: Record<string, any>,
  ): Promise<AevumResponse<UpdateResult>> {
    return this.execute("update", collection, { query, data: update });
  }

  /**
   * Deletes documents matching filter
   */
  public async delete(
    collection: string,
    query: QueryFilter,
  ): Promise<AevumResponse<DeleteResult>> {
    return this.execute("delete", collection, { query });
  }

  /**
   * Counts documents matching filter
   */
  public async count(
    collection: string,
    query: QueryFilter = {},
  ): Promise<AevumResponse<CountResult>> {
    return this.execute("count", collection, { query });
  }

  /**
   * Sets JSON Schema for collection validation
   */
  public async setSchema(
    collection: string,
    schema: SchemaDefinition,
  ): Promise<AevumResponse<SetSchemaResult>> {
    return this.execute("set_schema", collection, { schema });
  }

  /**
   * Creates new user with role-based access control
   */
  public async createUser(
    userKey: string,
    role: AevumUserRole,
  ): Promise<AevumResponse<CreateUserResult>> {
    return this.execute("create_user", "", { key: userKey, role });
  }

  /**
   * Gets connection pool statistics (if pooled)
   * @returns Pool stats or null if not using pooling
   */
  public getPoolStats(): { available: number; inUse: number; waiting: number } | null {
    return this.pool?.getStats() ?? null;
  }
}

export * from "./types/index";
export * from "./errors/aevum-error";
export * from "./connection/socket";
export * from "./connection/pool";
export * from "./operations/crud";
export * from "./admin/user-management";
