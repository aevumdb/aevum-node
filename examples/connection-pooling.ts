// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file examples/connection-pooling.ts
 * @brief Connection pooling with high concurrency
 */

import { AevumClient } from "../src/index";

/**
 * Demonstrates connection pooling with high concurrency using the AevumClient.
 * This example simulates multiple concurrent insert and query operations
 * to show how the connection pool manages connections efficiently.
 * @returns {Promise<void>} A Promise that resolves when all operations are complete.
 */
async function main(): Promise<void> {
  const client = new AevumClient({
    host: "127.0.0.1",
    port: 55001,
    apiKey: "root",
    poolSize: 10, // 10 concurrent connections
  });

  try {
    await client.connect();
    console.log("Connected with pool size 10");

    // Simulate 50 concurrent inserts
    const promises = Array.from({ length: 50 }, (_, i) =>
      client.insert("users_test", {
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: 20 + Math.floor(Math.random() * 50),
        status: "active",
      }),
    );

    // Monitor pool stats
    const monitor = setInterval(() => {
      const stats = client.getPoolStats();
      if (stats) {
        console.log(
          `[Pool] Available: ${stats.available}, In use: ${stats.inUse}, Waiting: ${stats.waiting}`,
        );
      }
    }, 500);

    // Execute all operations
    const results = await Promise.all(promises);
    clearInterval(monitor);

    console.log(`Inserted ${results.length} documents concurrently`);
    console.log(
      `Success count: ${results.filter((r) => r.status === "ok" || r.status === "success").length}`,
    );

    // Parallel queries
    const queries = Array.from({ length: 5 }, (_, i) =>
      client.find("users_test", { age: { $gte: 20 + i * 10 } }, { limit: 5 }),
    );

    const queryResults = await Promise.all(queries);
    console.log(`Executed ${queryResults.length} parallel queries`);

    await client.disconnect();
    console.log("Disconnected");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
