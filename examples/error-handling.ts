// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file examples/error-handling.ts
 * @brief Error handling patterns and best practices
 */

import {
  AevumClient,
  AevumError,
  AevumConnectionError,
  AevumAuthError,
  AevumTimeoutError,
  AevumOperationError,
} from "../src/index";

/**
 * Demonstrates basic error handling using try-catch blocks and checking for specific AevumDB error types.
 * @returns {Promise<void>} A Promise that resolves when the error handling demonstration is complete.
 */
async function basicErrorHandling(): Promise<void> {
  const client = new AevumClient({ apiKey: "invalid-key" });

  try {
    await client.insert("users_test", { name: "John" });
  } catch (error) {
    if (error instanceof AevumAuthError) {
      console.error("Authentication failed - check API key");
    } else if (error instanceof AevumConnectionError) {
      console.error("Connection failed - server may be down");
    } else if (error instanceof AevumError) {
      console.error(`AevumDB Error [${error.code}]: ${error.message}`);
    }
  } finally {
    await client.disconnect();
  }
}

/**
 * Demonstrates a retry mechanism with exponential backoff for transient errors.
 * @returns {Promise<void>} A Promise that resolves when the retry demonstration is complete.
 */
async function retryWithBackoff(): Promise<void> {
  const client = new AevumClient();

  /**
   * Executes a function with a retry mechanism and exponential backoff.
   * @template T The return type of the function to execute.
   * @param {() => Promise<T>} fn The asynchronous function to execute.
   * @param {number} [maxAttempts=3] The maximum number of retry attempts.
   * @returns {Promise<T>} A Promise that resolves with the result of the function or rejects with the last error.
   */
  async function executeWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry auth errors
        if (error instanceof AevumAuthError) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt - 1) * 100;
          console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  try {
    await client.connect();

    const result = await executeWithRetry(() => client.find("users_test", {}, { limit: 10 }));
    console.log(`Retrieved ${result.data?.length} users after retries`);
  } catch (error) {
    console.error("Failed after retries:", error);
  } finally {
    await client.disconnect();
  }
}

/**
 * Demonstrates handling different error types using a switch statement for more specific logic.
 * @returns {Promise<void>} A Promise that resolves when the type-specific error handling demonstration is complete.
 */
async function typeSpecificHandling(): Promise<void> {
  const client = new AevumClient();

  try {
    await client.connect();

    // Try operations that might fail
    await client.insert("users_test", { name: "John" });
    console.log("Successfully executed type-specific operation");
  } catch (error) {
    switch (true) {
      case error instanceof AevumConnectionError:
        console.error("Connection issue");
        // Implement reconnection logic
        break;

      case error instanceof AevumAuthError:
        console.error("Auth failed");
        // Redirect to login
        break;

      case error instanceof AevumTimeoutError:
        console.error("Operation timeout");
        // Use shorter timeout or check performance
        break;

      case error instanceof AevumOperationError:
        console.error(`Operation failed: ${(error as AevumOperationError).message}`);
        // Log server error details
        break;

      case error instanceof AevumError:
        console.error(`Generic AevumDB error [${(error as AevumError).code}]`);
        break;

      default:
        console.error("Unknown error:", error);
    }
  } finally {
    await client.disconnect();
  }
}

/**
 * Main function to run all error handling examples.
 * @returns {Promise<void>} A Promise that resolves when all examples are executed.
 */
async function main(): Promise<void> {
  console.log("Basic Error Handling:");
  await basicErrorHandling();

  console.log("Retry with Backoff:");
  await retryWithBackoff();

  console.log("Type-Specific Handling:");
  await typeSpecificHandling();
}

main();
