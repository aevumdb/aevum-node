# Error Handling

Comprehensive guide to AevumDB error classes and handling strategies for the Node.js driver.

## Error Hierarchy

The AevumDB Node.js driver uses a structured error hierarchy, allowing for precise error handling. All custom errors extend from `AevumError`, which in turn extends JavaScript's built-in `Error` class.

```
Error (JavaScript built-in)
└── AevumError (Base class for all AevumDB driver-specific errors)
    ├── AevumConnectionError
    ├── AevumAuthError
    ├── AevumValidationError
    ├── AevumNotFoundError
    ├── AevumProtocolError
    ├── AevumOperationError
    └── AevumTimeoutError
```

## Error Classes

Each error class provides specific context about the type of issue encountered.

### `AevumError`

The base class for all AevumDB driver-specific errors. It includes a message and a programmatic error `code`.

```typescript
// Constructor signature
constructor(message: string, code?: string = 'AEVUM_ERROR')
```

**Properties:**
- `message`: `string` - A human-readable description of the error.
- `code`: `string` - A programmatic error code (e.g., `'AUTH_ERROR'`, `'CONNECTION_ERROR'`) for easier handling. Defaults to `'AEVUM_ERROR'`.
- `name`: `string` - Always `'AevumError'` for this base class.

### `AevumConnectionError`

Thrown when there's an issue establishing or maintaining a socket connection to the AevumDB server.

**Causes:**
- The AevumDB server is unreachable (e.g., server is down, incorrect host/port).
- Network connectivity issues preventing communication.
- Connection timeout during the initial `connect()` phase.

**Example:**
```typescript
import { AevumClient, AevumConnectionError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Configure with host/port as needed

try {
  await client.connect();
} catch (error: any) {
  if (error instanceof AevumConnectionError) {
    console.error('Cannot reach AevumDB server:', error.message);
    // Implement reconnection logic or notify an administrator.
  } else {
    console.error('Unexpected error during connection:', error);
  }
}
```

### `AevumAuthError`

Thrown when an authentication or authorization failure occurs.

**Causes:**
- An invalid or expired API key is provided.
- The API key used does not have sufficient permissions for the requested operation.
- The associated user account is disabled or deleted on the server.

**Example:**
```typescript
import { AevumClient, AevumAuthError } from '@aevumdb/node-driver';

const client = new AevumClient({ apiKey: 'invalid-or-unauthorized-key' });

try {
  await client.insert('protected_collection', { data: 'sensitive' });
} catch (error: any) {
  if (error instanceof AevumAuthError) {
    console.error('Authentication failed - check API key and permissions:', error.message);
    // Refresh credentials, log out the user, or notify an administrator.
  } else {
    console.error('Unexpected error during operation:', error);
  }
}
```

### `AevumValidationError`

Thrown when input provided to a driver method is invalid before being sent to the server. This typically indicates a client-side programming error.

**Causes:**
- An empty or invalid collection name is provided.
- A malformed query filter or update object is passed.
- Invalid parameter values for driver methods (e.g., non-string collection name).

**Example:**
```typescript
import { AevumClient, AevumValidationError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client

try {
  await client.find('', {}); // Attempt to query with an empty collection name
} catch (error: any) {
  if (error instanceof AevumValidationError) {
    console.error('Client-side input validation failed:', error.message);
    // Correct the input parameters.
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### `AevumNotFoundError`

Thrown when a requested resource (like a collection or document) does not exist on the server.

**Causes:**
- Attempting to operate on a collection that does not exist.
- Attempting to update or delete a document that cannot be found.

**Example:**
```typescript
import { AevumClient, AevumNotFoundError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client

try {
  await client.update('nonexistent_collection', { _id: '123' }, { status: 'updated' });
} catch (error: any) {
  if (error instanceof AevumNotFoundError) {
    console.error('Resource not found:', error.message);
    // Verify collection or document existence, or handle as a business logic case.
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### `AevumProtocolError`

Thrown when there's an issue with the communication protocol between the client and the server, typically due to malformed data or version incompatibilities.

**Causes:**
- Invalid JSON received in the server response.
- The server response format does not conform to the expected protocol.
- Encoding issues during data transmission.

**Example:**
```typescript
import { AevumClient, AevumProtocolError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client

try {
  const result = await client.find('users');
} catch (error: any) {
  if (error instanceof AevumProtocolError) {
    console.error('Protocol error: Server response invalid or malformed:', error.message);
    // This may indicate a version mismatch between client/server or corrupted data.
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### `AevumOperationError`

Thrown for server-side errors related to the execution of a requested database operation. These are typically functional errors reported by the AevumDB server.

**Causes:**
- JSON Schema validation failure for an inserted or updated document.
- Generic query execution errors on the server.
- Database constraint violations (e.g., unique key violation).
- Server-side issues like insufficient disk space.

**Example:**
```typescript
import { AevumClient, AevumOperationError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client

try {
  // Assuming a schema exists that requires a valid email format
  await client.insert('users', { email: 'invalid-email-format' });
} catch (error: any) {
  if (error instanceof AevumOperationError) {
    console.error(`AevumDB Operation Failed [${error.code}]:`, error.message);
    // Check server logs for more details on the operation failure.
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### `AevumTimeoutError`

Thrown when an operation (connection or query) exceeds its configured timeout threshold.

**Causes:**
- The initial TCP connection attempt takes longer than `connectTimeout`.
- A database query or command takes longer than `queryTimeout` to complete.
- The AevumDB server is slow to respond due to heavy load or complex operations.

**Example:**
```typescript
import { AevumClient, AevumTimeoutError } from '@aevumdb/node-driver';

const client = new AevumClient({
  connectTimeout: 5000, // 5 seconds for initial connection
  queryTimeout: 10000,  // 10 seconds per query operation
});

try {
  await client.connect();
  await client.find('large_collection', { complex_query: true });
} catch (error: any) {
  if (error instanceof AevumTimeoutError) {
    console.error('Operation timed out:', error.message);
    // Consider increasing timeout, optimizing the query, or checking server performance.
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Handling Strategies

Effective error handling is crucial for building robust and reliable applications.

### Basic Try-Catch

The fundamental approach to error handling in asynchronous JavaScript, catching general errors.

```typescript
import { AevumClient, AevumError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client

try {
  const result = await client.insert('users', { name: 'John Doe' });
  console.log('Success: Document inserted with ID', result.data?._id);
} catch (error: any) {
  if (error instanceof AevumError) {
    console.error(`AevumDB Error [${error.code}]: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Type-Specific Handling

Using `instanceof` to differentiate between various `AevumError` subclasses and implement tailored recovery logic.

```typescript
import {
  AevumClient,
  AevumConnectionError,
  AevumAuthError,
  AevumTimeoutError,
  AevumOperationError,
} from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client
// Assuming retryWithBackoff function is available from BEST_PRACTICES.md example

/**
 * Inserts a document safely with type-specific error handling.
 * @param {string} collection The target collection.
 * @param {object} document The document to insert.
 * @returns {Promise<any>} The result of the insert operation.
 */
async function safeInsert(collection: string, document: any) {
  try {
    return await client.insert(collection, document);
  } catch (error: any) {
    if (error instanceof AevumConnectionError) {
      console.error('Network issue, considering retry or fallback:', error.message);
      // Example: return retryWithBackoff(() => client.insert(collection, document));
      throw error; // Re-throw after logging/handling
    } else if (error instanceof AevumAuthError) {
      console.error('Authentication failed, please log in again:', error.message);
      throw error; // Authentication errors are typically not retriable
    } else if (error instanceof AevumTimeoutError) {
      console.error('Operation timed out:', error.message);
      throw error; // Consider using a longer timeout or optimizing the query
    } else if (error instanceof AevumOperationError) {
      console.error('Server operation failed:', error.message);
      throw error; // Log server error details, e.g., schema validation
    } else {
      console.error('Unknown error during insert:', error);
      throw error;
    }
  }
}
```

### Retry with Exponential Backoff

A common pattern for transient errors, retrying failed operations with increasing delays to avoid overwhelming the server.

```typescript
import { AevumClient, AevumAuthError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client

/**
 * Retries an asynchronous function with exponential backoff.
 * @param {Function} fn The asynchronous function to retry.
 * @param {number} [maxAttempts=3] Maximum number of retry attempts.
 * @param {number} [initialDelay=100] Initial delay in milliseconds before the first retry.
 * @returns {Promise<any>} The result of the successful function call.
 * @throws {Error} The last error if all attempts fail, or an AevumAuthError if encountered.
 */
async function retryWithBackoff(fn: () => Promise<any>, maxAttempts = 3, initialDelay = 100) {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Do not retry on authentication errors.
      if (error instanceof AevumAuthError) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError; // Re-throw the last error if all attempts fail
}

// Example Usage:
// Make sure client is connected before usage.
// await client.connect();
// await retryWithBackoff(() => client.find('users'));
```

### Batch Operations with Error Aggregation

Handling errors gracefully in batch operations by aggregating successes and failures, rather than failing the entire batch.

```typescript
import { AevumClient, AevumError } from '@aevumdb/node-driver';

const client = new AevumClient(); // Assuming connected client

/**
 * Performs batch inserts and aggregates results, separating successful and failed operations.
 * @param {any[]} documents An array of documents to insert.
 * @returns {Promise<{ succeeded: { document: any, _id: string }[], failed: { document: any, error: string }[] }>}
 *   An object containing arrays of succeeded and failed inserts.
 */
async function batchInsert(documents: any[]) {
  const results = {
    succeeded: [] as { document: any, _id: string }[],
    failed: [] as { document: any, error: string }[],
  };

  for (const doc of documents) {
    try {
      const result = await client.insert('users', doc);
      results.succeeded.push({
        document: doc,
        _id: result.data?._id as string,
      });
    } catch (error: any) {
      results.failed.push({
        document: doc,
        error: error instanceof AevumError ? error.message : String(error),
      });
    }
  }

  console.log(`Batch Insert Summary: Succeeded: ${results.succeeded.length}, Failed: ${results.failed.length}`);
  return results;
}
```

### Timeout Configuration

Configuring and handling timeouts for both connection establishment and individual query operations to prevent indefinite waits.

```typescript
import { AevumClient, AevumTimeoutError } from '@aevumdb/node-driver';

// Example client configured with specific timeouts
const client = new AevumClient({
  host: '127.0.0.1',
  port: 55001,
  queryTimeout: 5000, // 5 second timeout per query
  connectTimeout: 3000 // 3 second timeout for initial connection
});

/**
 * Demonstrates handling timeouts for a query operation.
 * @returns {Promise<void>} A promise that resolves after the example runs.
 */
async function handleQueryTimeoutExample() {
  try {
    await client.connect();
    // This query will throw AevumTimeoutError if it takes longer than 5 seconds.
    const result = await client.find('users', { status: 'active' }, { limit: 1000 });
    console.log('Query successful:', result.data?.length, 'users found.');
  } catch (error: any) {
    if (error instanceof AevumTimeoutError) {
      console.error('Query exceeded timeout:', error.message);
      // Fallback strategy: try a smaller, faster query, or inform the user.
      // e.g., const fallbackResult = await client.find('users', { status: 'active' }, { limit: 100 });
    } else {
      console.error('An unexpected error occurred:', error);
    }
  } finally {
    await client.disconnect();
  }
}
```

## Error Codes

Common error codes returned in `AevumResponse.error.code` for programmatic error identification and handling.

| Code | Meaning | Action |
|------|---------|--------|
| `AUTH_ERROR` | Authentication or authorization failed. | Check API key, refresh credentials, verify user permissions. |
| `NOT_FOUND` | The requested resource (collection, document) does not exist. | Verify collection/document exists, check query parameters. |
| `VALIDATION_ERROR` | Client-side input validation failed for driver method parameters. | Fix input parameters or collection name in your code. |
| `OPERATION_ERROR` | A server-side database operation failed (e.g., schema validation, constraint violation). | Check server logs for details, review schema compatibility, adjust data. |
| `CONNECTION_ERROR` | Network connectivity issue or server is unreachable. | Verify server is running, check network configuration, inspect firewall rules. |
| `TIMEOUT` | An operation exceeded its configured timeout threshold. | Increase timeout if acceptable, optimize query, profile server performance. |
| `PROTOCOL_ERROR` | Invalid or malformed response received from the server. | Check client/server version compatibility, report as a potential bug. |

## Best Practices

Key recommendations for effective error handling with the AevumDB Node.js driver.

1.  **Always handle connection errors**: Implement robust reconnection logic or application-level fallbacks.
2.  **Distinguish authentication/authorization errors**: Do not retry on `AevumAuthError` as it usually indicates a permanent permission issue.
3.  **Use timeouts in production**: Prevent indefinite waits for unresponsive servers or long-running queries.
4.  **Log error context**: Include collection, operation, and relevant parameters in error logs for easier debugging.
5.  **Monitor error rates**: Track error patterns to identify recurring issues or performance bottlenecks.
6.  **Test error paths**: Ensure your application handles expected and unexpected failures gracefully.
7.  **Use typed error catching**: Leverage `instanceof AevumError` subclasses for specific, targeted error handling.
