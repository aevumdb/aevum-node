// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/admin/user-management.ts
 * @brief User and schema management operations
 */

import {
  AevumResponse,
  SchemaDefinition,
  SetSchemaResult,
  CreateUserResult,
  AevumUserRole,
} from "../types/index";

/**
 * Admin operation definitions
 * Requires ADMIN role for execution
 */
export interface IAdminOperations {
  /**
   * Sets JSON Schema validation for collection
   * Enables schema enforcement on all insert/update operations
   * @param collection Target collection
   * @param schema JSON Schema definition
   * @returns Operation status
   */
  setSchema(collection: string, schema: SchemaDefinition): Promise<AevumResponse<SetSchemaResult>>;

  /**
   * Creates new database user with role-based access
   * @param userKey New user's API key
   * @param role User role: READ_ONLY, READ_WRITE, or ADMIN
   * @returns Operation status
   */
  createUser(userKey: string, role: AevumUserRole): Promise<AevumResponse<CreateUserResult>>;
}
