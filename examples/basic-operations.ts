// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file examples/basic-operations.ts
 * @brief Basic CRUD operations examples
 */

import { AevumClient } from "../src/index";

/**
 * Demonstrates basic CRUD (Create, Read, Update, Delete) operations using the AevumClient.
 * This example connects to an AevumDB instance, performs various data manipulations,
 * and handles potential errors during the process.
 * @returns {Promise<void>} A Promise that resolves when all operations are complete.
 */
async function main(): Promise<void> {
  const client = new AevumClient({
    host: "127.0.0.1",
    port: 55001,
    apiKey: "root",
  });

  try {
    // Connect to server
    await client.connect();
    console.log("Connected to AevumDB");

    // Insert document
    const insertResult = await client.insert("users_test", {
      name: "John Doe",
      email: "john@example.com",
      age: 30,
      status: "active",
    });
    const userId = insertResult.data?._id;
    console.log(`Inserted user: ${userId}`);

    // Query documents
    const findResult = await client.find("users_test", { age: { $gte: 25 } }, { limit: 10 });
    console.log(`Found ${findResult.data?.length || 0} users`);

    // Count documents
    const countResult = await client.count("users_test", { status: "active" });
    console.log(`Active users: ${countResult.data?.count}`);

    // Update document
    const updateResult = await client.update(
      "users_test",
      { _id: userId },
      { age: 31, lastUpdated: new Date().toISOString() },
    );
    console.log(`Updated ${updateResult.data?.updated_count} documents`);
    // Delete document
    const deleteResult = await client.delete("users_test", { _id: userId });
    console.log(`Deleted ${deleteResult.data?.deleted_count} documents`);
    await client.disconnect();
    console.log("Disconnected");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
