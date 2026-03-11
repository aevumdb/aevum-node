// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/operations/crud.ts
 * @brief CRUD (Create, Read, Update, Delete) operations
 */

import {
  AevumResponse,
  QueryFilter,
  FindOptions,
  InsertResult,
  UpdateResult,
  DeleteResult,
  CountResult,
} from "../types/index";

/**
 * CRUD operation definitions
 * Implemented by AevumClient
 */
export interface ICrudOperations {
  /**
   * Inserts single document into collection
   * @param collection Target collection name
   * @param document JSON object to insert
   * @returns Response with generated _id
   */
  insert(collection: string, document: Record<string, any>): Promise<AevumResponse<InsertResult>>;

  /**
   * Queries documents matching filter
   * @param collection Target collection
   * @param query Filter criteria using query operators
   * @param options Pagination and sorting (limit, skip, sort)
   * @returns Array of matching documents
   */
  find<T = any>(
    collection: string,
    query?: QueryFilter,
    options?: FindOptions,
  ): Promise<AevumResponse<T[]>>;

  /**
   * Updates documents matching filter
   * @param collection Target collection
   * @param query Filter to identify documents
   * @param update Replacement or update operators
   * @returns Count of modified documents
   */
  update(
    collection: string,
    query: QueryFilter,
    update: Record<string, any>,
  ): Promise<AevumResponse<UpdateResult>>;

  /**
   * Deletes documents matching filter
   * @param collection Target collection
   * @param query Filter to identify documents for deletion
   * @returns Count of deleted documents
   */
  delete(collection: string, query: QueryFilter): Promise<AevumResponse<DeleteResult>>;

  /**
   * Counts documents matching filter
   * @param collection Target collection
   * @param query Filter criteria (optional)
   * @returns Total matching document count
   */
  count(collection: string, query?: QueryFilter): Promise<AevumResponse<CountResult>>;
}
