# Best Practices

Production-ready patterns for using the AevumDB Node.js driver.

## Connection Management

### Application Startup

Ensuring the AevumDB client is properly initialized and connected when your application starts.

```typescript
import { AevumClient } from '@aevumdb/node-driver';

// Initialize the client with configuration from environment variables for flexibility.
const client = new AevumClient({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '55001', 10), // Specify radix for parseInt
  apiKey: process.env.DB_API_KEY,
  poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
  queryTimeout: 10000, // 10 seconds timeout
});

// Establish connection to AevumDB on application startup.
await client.connect();

// Export the client instance for use across different modules/routes.
export { client };
```

### Graceful Shutdown

Implementing graceful shutdown procedures to ensure all pending operations are completed and connections are properly closed before the application exits.

```typescript
// Listen for SIGTERM (e.g., from process managers like PM2, Kubernetes)
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await client.disconnect(); // Disconnect AevumDB client
  process.exit(0); // Exit cleanly
});

// Listen for SIGINT (e.g., Ctrl+C in development)
process.on('SIGINT', async () => {
  console.log('Interrupted, shutting down...');
  await client.disconnect(); // Disconnect AevumDB client
  process.exit(1); // Exit with an error code
});
```

## Error Handling

### Structured Error Response

Providing a consistent error response format for API endpoints.

```typescript
import { AevumError } from '@aevumdb/node-driver';

/**
 * Creates a structured error response for API endpoints.
 * @param {unknown} error - The error object caught.
 * @returns {object} A standardized error response object.
 */
function errorResponse(error: unknown) {
  if (error instanceof AevumError) {
    return {
      success: false,
      error: error.code,
      message: error.message,
    };
  }

  // Handle unexpected errors gracefully.
  return {
    success: false,
    error: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
}
```

### Retry Logic with Jitter

Implementing robust retry mechanisms with exponential backoff and jitter for transient errors to improve application resilience.

```typescript
import { AevumAuthError, AevumValidationError } from '@aevumdb/node-driver';

/**
 * Executes an asynchronous function with a retry mechanism, exponential backoff, and jitter.
 * @template T The return type of the function.
 * @param {() => Promise<T>} fn The asynchronous function to execute.
 * @param {number} [maxAttempts=3] The maximum number of retry attempts.
 * @returns {Promise<T>} A promise that resolves with the result of `fn` or rejects after `maxAttempts`.
 * @throws {Error} The last error encountered if all retries fail.
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) { // Type 'any' used here for broader error handling
      if (attempt === maxAttempts) {
        throw error; // Throw the error if max attempts reached
      }

      // Skip retry for non-transient errors like authentication or validation failures.
      if (
        error instanceof AevumAuthError ||
        error instanceof AevumValidationError
      ) {
        throw error;
      }

      // Exponential backoff with a random jitter to prevent thundering herd problem.
      const delay = Math.pow(2, attempt - 1) * 100; // Base delay: 100ms, 200ms, 400ms...
      const jitter = Math.random() * delay * 0.1; // Add up to 10% random jitter
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }
  // This part should technically be unreachable if an error is always thrown
  // after maxAttempts, but TS might require a return/throw here.
  throw new Error('Reached unreachable code in executeWithRetry');
}
```

## Query Optimization

### Pagination Efficiency

Efficiently fetching large datasets using pagination to prevent excessive memory usage and improve response times.

```typescript
import { AevumClient } from '@aevumdb/node-driver';
// Assuming 'client' is an initialized AevumClient instance
// const client = new AevumClient(...);

/**
 * Fetches all documents from a collection using pagination.
 * @param {string} collection The name of the collection.
 * @param {number} [pageSize=1000] The number of documents to fetch per page.
 * @returns {Promise<any[]>} A promise that resolves to an array of all documents.
 */
async function fetchAllDocuments(collection: string, pageSize = 1000) {
  const allDocuments = [];
  let skip = 0;

  while (true) {
    const result = await client.find(collection, {}, {
      skip,
      limit: pageSize,
    });

    if (!result.data || result.data.length === 0) break; // No more documents

    allDocuments.push(...result.data);
    skip += pageSize;

    // Optional: Add a safety break for extremely large result sets to prevent OOM errors.
    if (allDocuments.length > 1000000) { // e.g., limit to 1 million documents
      console.warn('Large result set detected, truncating to avoid excessive memory usage.');
      break;
    }
  }

  return allDocuments;
}
```

### Query Filter Optimization

Leveraging server-side filtering capabilities to minimize data transfer and processing.

```typescript
// Good Example: Specific filter with operators.
// The database processes the filter, returning only relevant data.
const activeAndAgeFilteredUsers = await client.find('users', {
  status: 'active',
  age: { $gte: 21, $lte: 65 },
});

// Bad Example: Load all documents then filter in client-side code.
// This transfers potentially large amounts of unnecessary data over the network.
const allUsers = await client.find('users');
const filteredUsers = allUsers.data?.filter(u => u.status === 'active');
```

### Batch Operations

Performing multiple operations in batches to reduce network overhead and improve throughput.

```typescript
// Assuming 'client' is an initialized AevumClient instance
// const client = new AevumClient(...);

/**
 * Inserts a batch of documents into a collection.
 * Aggregates results including successes and errors.
 * @param {any[]} documents An array of documents to insert.
 * @param {number} [chunkSize=100] The number of documents to insert in each concurrent chunk.
 * @returns {Promise<object>} An object containing counts of successful/failed inserts and an array of errors.
 */
async function batchInsert(documents: any[], chunkSize = 100) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[], // Aggregates error details
  };

  for (let i = 0; i < documents.length; i += chunkSize) {
    const chunk = documents.slice(i, i + chunkSize);

    const promises = chunk.map((doc) =>
      client
        .insert('users', doc)
        .then(() => {
          results.success++;
        })
        .catch((error: any) => { // Type 'any' for error for broader compatibility
          results.failed++;
          results.errors.push({
            document: doc,
            error: error.message,
          });
        })
    );

    await Promise.all(promises); // Wait for all inserts in the current chunk to complete
  }

  return results;
}
```

## Monitoring & Logging

### Pool Monitoring

Regularly monitoring connection pool statistics to detect contention, identify bottlenecks, and ensure optimal resource utilization.

```typescript
import { AevumClient } from '@aevumdb/node-driver';
// Assuming 'client' is an initialized AevumClient instance with poolSize set
// const client = new AevumClient({ poolSize: 10, ... });
const poolSize = 10; // Must be explicitly defined if not available from client.

// Example: Simple logger for demonstration purposes
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

setInterval(() => {
  const stats = client.getPoolStats();
  if (stats) {
    const utilization = (stats.inUse / poolSize) * 100;
    logger.info('Pool stats', {
      available: stats.available,
      inUse: stats.inUse,
      waiting: stats.waiting,
      utilization: `${utilization.toFixed(1)}%`,
    });

    if (stats.waiting > 5) { // Threshold for warning
      logger.warn('High pool contention detected: many requests are waiting for a connection.');
    }
  }
}, 30000); // Check every 30 seconds
```

### Query Logging

Logging query execution details, including duration and results, to gain insights into application performance and troubleshoot slow operations.

```typescript
import { AevumClient, AevumError } from '@aevumdb/node-driver';
// Assuming 'client' is an initialized AevumClient instance
// const client = new AevumClient(...);

// Example: Simple logger for demonstration purposes
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

/**
 * Executes a find query and logs its execution details.
 * @param {string} collection The name of the collection.
 * @param {any} [query={}] The query filter.
 * @returns {Promise<any>} The result of the find operation.
 * @throws {Error} Any error encountered during the query.
 */
async function loggedQuery(collection: string, query: any = {}) {
  const startTime = Date.now();

  try {
    const result = await client.find(collection, query);
    const duration = Date.now() - startTime;

    logger.info('Query executed successfully', {
      collection,
      resultCount: result.data?.length,
      durationMs: duration,
    });

    return result;
  } catch (error: any) { // Type 'any' for error for broader compatibility
    logger.error('Query failed', {
      collection,
      durationMs: Date.now() - startTime,
      error: error instanceof AevumError ? error.code : String(error),
    });

    throw error;
  }
}
```

## Security

### Input Validation

Implementing robust input validation to protect against common vulnerabilities like injection attacks and ensure data integrity.

```typescript
import { AevumValidationError } from '@aevumdb/node-driver';

/**
 * Validates user input for a document.
 * @param {any} document The document to validate.
 * @returns {any} The validated document.
 * @throws {AevumValidationError} If validation fails.
 */
function validateUserInput(document: any) {
  if (!document.email || typeof document.email !== 'string' || !document.email.includes('@')) {
    throw new AevumValidationError('Invalid email format or missing email');
  }

  if (!document.name || typeof document.name !== 'string' || document.name.trim() === '') {
    throw new AevumValidationError('Invalid name or missing name');
  }

  // Example: Prevent type mismatch that could lead to unexpected behavior or injection.
  if (typeof document.age !== 'number' && typeof document.age !== 'undefined') {
    throw new AevumValidationError('Age must be a number');
  }

  return document;
}
```

### API Key Management

Best practices for handling API keys securely to prevent unauthorized access.

```typescript
import { AevumClient } from '@aevumdb/node-driver';
// Good Example: Always use environment variables for sensitive information like API keys.
const apiKeyFromEnv = process.env.AEVUMDB_API_KEY;

// Bad Example: Never hardcode sensitive API keys directly in your source code.
// const client = new AevumClient({ apiKey: 'my-secret-key-hardcoded' });

// Good Example: In production, consider rotating API keys regularly.
// Multiple clients can be configured for different services or roles.
const clients = {
  app: new AevumClient({ apiKey: process.env.APP_KEY }),
  analytics: new AevumClient({ apiKey: process.env.ANALYTICS_KEY }),
  admin: new AevumClient({ apiKey: process.env.ADMIN_KEY }),
};
```

### Role-Based Access

Implementing role-based access control to enforce fine-grained permissions for different user types.

```typescript
import { AevumClient, AevumAuthError } from '@aevumdb/node-driver';
// Assuming 'client' is an initialized AevumClient instance configured with appropriate API key
// const client = new AevumClient({ apiKey: '...' });

/**
 * Performs an operation based on user roles and actions.
 * @param {string} action The action to perform (e.g., 'read', 'write').
 * @param {object} user An object representing the user, including their API key and ID/input.
 * @returns {Promise<any>} The result of the operation.
 * @throws {AevumAuthError} If the user has insufficient permissions.
 */
async function userOperation(action: string, user: { apiKey: string, id?: string, input?: any }) {
  // Create a client instance with the user's specific API key to enforce their permissions.
  const client = new AevumClient({
    apiKey: user.apiKey,
  });

  try {
    await client.connect();

    if (action === 'read') {
      return await client.find('documents', { owner: user.id });
    } else if (action === 'write') {
      return await client.insert('documents', {
        owner: user.id,
        content: user.input,
      });
    }

    // Throw an error if the action is not allowed for the user's role/permissions.
    throw new AevumAuthError('Insufficient permissions for this action');
  } finally {
    await client.disconnect();
  }
}
```

## Performance

### Connection Pool Tuning

Optimizing the connection pool size is crucial for balancing resource usage and throughput in high-concurrency applications.

```bash
# General guidelines for connection pool sizing based on workload:
# - Low-frequency workloads (e.g., CLI tools, background scripts): poolSize = 0 (single connection)
# - Medium concurrency (e.g., ~100 requests/second): poolSize = 15-20
# - High concurrency (e.g., 500+ requests/second): poolSize = 50-100
# - Very high concurrency (e.g., 1000+ requests/second): poolSize = 200+
# Note: Optimal pool size depends on server performance, network latency, and average query execution time.
```

### Query Timeout Tuning

Configuring appropriate query timeouts to prevent long-running operations from impacting application responsiveness.

```typescript
import { AevumClient, AevumTimeoutError } from '@aevumdb/node-driver';

// Short timeout for user-facing endpoints to ensure quick responses.
const userFacingClient = new AevumClient({
  queryTimeout: 5000, // 5 seconds maximum
});

// Longer timeout for batch processing or administrative operations that may take more time.
const batchClient = new AevumClient({
  queryTimeout: 60000, // 60 seconds maximum
});

// Example of handling a query timeout:
async function performUserFacingQuery() {
  try {
    const result = await userFacingClient.find('users', { status: 'active' });
    console.log('User query successful:', result.data);
  } catch (error: any) {
    if (error instanceof AevumTimeoutError) {
      console.error('User-facing query timed out:', error.message);
      // Implement fallback logic or inform the user.
    } else {
      console.error('User-facing query failed:', error.message);
    }
  }
}
```

## Testing

### Mock AevumDB for Tests

Using mock objects for the `AevumClient` in unit tests to isolate components, speed up test execution, and ensure consistent test results without requiring an actual database connection.

```typescript
import { AevumClient, AevumResponse } from '@aevumdb/node-driver';

// A simple mock client that simulates basic AevumDB operations.
class MockAevumClient extends AevumClient {
  async insert(collection: string, document: any): Promise<AevumResponse<{ _id: string }>> {
    // Simulate a successful insert operation.
    return {
      status: 'success',
      message: 'Document inserted (mock)',
      data: { _id: 'mock-id-' + Date.now() },
    };
  }

  async find(collection: string, query?: any, options?: any): Promise<AevumResponse<any[]>> {
    // Simulate a successful find operation, returning an empty array or predefined data.
    return {
      status: 'success',
      message: 'Found documents (mock)',
      data: [], // Return empty array or mock specific data based on 'query'
    };
  }

  // Add mocks for other AevumClient methods as needed for your tests.
}

// Example usage in a Jest test suite:
describe('User service', () => {
  let client: MockAevumClient; // Use the mock client in tests

  beforeEach(() => {
    client = new MockAevumClient(); // Initialize mock client before each test
  });

  test('should insert user successfully', async () => {
    const result = await client.insert('users', { name: 'John Doe' });
    expect(result.data?._id).toBeDefined();
    expect(result.message).toContain('(mock)');
  });

  test('should find no users if collection is empty', async () => {
    const result = await client.find('users');
    expect(result.data).toEqual([]);
  });
});
```
