// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file examples/admin-operations.ts
 * @brief Admin operations: schema and user management
 */

import { AevumClient, AevumUserRole } from "../src/index";

/**
 * Demonstrates administrative operations such as setting schemas and managing users (creating read-only,
 * read-write, and admin users) using the AevumClient. It also includes testing access permissions for a read-only user.
 * @returns {Promise<void>} A Promise that resolves when all admin operations and tests are complete.
 */
async function main(): Promise<void> {
  const admin = new AevumClient({
    host: "127.0.0.1",
    port: 55001,
    apiKey: "root", // Use root key for testing
  });

  try {
    await admin.connect();
    console.log("Connected as admin");

    // Set schema for users collection
    const schema = {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
        email: {
          type: "string",
          format: "email",
        },
        age: {
          type: "integer",
          minimum: 0,
          maximum: 150,
        },
        status: {
          type: "string",
          enum: ["active", "inactive", "suspended"],
        },
      },
      required: ["name", "email"],
      additionalProperties: true,
    };

    const schemaResult = await admin.setSchema("users", schema);
    console.log(`Schema set: ${schemaResult.message}`);

    // Create read-only user for analytics
    const readonlyResult = await admin.createUser("analytics-key", AevumUserRole.READ_ONLY);
    console.log(`Created read-only user: ${readonlyResult.message}`);

    // Create read-write user for application
    const appResult = await admin.createUser("app-user-prod", AevumUserRole.READ_WRITE);
    console.log(`Created read-write user: ${appResult.message}`);

    // Create another admin
    const adminResult = await admin.createUser("admin-backup", AevumUserRole.ADMIN);
    console.log(`Created admin user: ${adminResult.message}`);

    // Test with read-only user
    const reader = new AevumClient({ apiKey: "analytics-key" });

    await reader.connect();
    console.log("Connected as read-only user");

    // This should work
    const users = await reader.find("users", {}, { limit: 5 });
    console.log(`Read-only user can query: ${users.data?.length || 0} users`);

    // This should fail (no insert permission)
    try {
      await reader.insert("users", { name: "Test", email: "test@example.com" });
      console.log("Read-only user should not be able to insert");
    } catch (error) {
      console.log(`Insert blocked for read-only user (expected)`);
    }

    await reader.disconnect();
    await admin.disconnect();
    console.log("Disconnected");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
