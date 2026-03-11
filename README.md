# AevumDB Node.js Driver

[![npm version](https://img.shields.io/npm/v/@aevumdb/node-driver)](https://www.npmjs.com/package/@aevumdb/node-driver)
[![npm downloads](https://img.shields.io/npm/dm/@aevumdb/node-driver)](https://www.npmjs.com/package/@aevumdb/node-driver)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-AEVUMDB%20Community-green)](LICENSE)

Official high-performance Node.js driver for **AevumDB** NoSQL database with **100% API coverage**.

-   **100% Feature Complete**: Provides full support for all CRUD, query, admin, and schema operations.
-   **TypeScript First**: Designed with TypeScript from the ground up, offering full type safety and comprehensive JSDoc documentation.
-   **High Performance**: Includes advanced features like connection pooling for efficient handling of concurrent operations.
-   **Async/Await**: Utilizes a modern, Promise-based API for clean and readable asynchronous code.
-   **Production Ready**: Built with comprehensive error handling and logging mechanisms for robust production deployments.

## Quick Start

Get started with the AevumDB Node.js Driver quickly.

### Installation

Install the driver using `npm` or `pnpm`:

```bash
npm install @aevumdb/node-driver
# or
pnpm add @aevumdb/node-driver
```

### Basic Usage

Connect to your AevumDB instance and perform basic CRUD operations.

```typescript
import { AevumClient } from '@aevumdb/node-driver';

async function main() {
  const client = new AevumClient({
    host: '127.0.0.1',
    port: 55001,
    apiKey: 'root', // Use a secure API key in production
    poolSize: 10, // Configure connection pooling for high concurrency
  });

  try {
    await client.connect();
    console.log('Connected to AevumDB');

    // Insert a document
    const result = await client.insert('users', {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });
    console.log('Created user:', result.data?._id);

    // Query documents
    const users = await client.find('users', { age: { $gte: 21 } }, { limit: 10 });
    console.log('Found users:', users.data?.length, 'document(s)');

    // Update documents
    const updated = await client.update(
      'users',
      { email: 'john@example.com' },
      { age: 31 }
    );
    console.log('Updated documents:', updated.data?.updated_count);

    // Delete documents
    const deleted = await client.delete('users', { email: 'john@example.com' });
    console.log('Deleted documents:', deleted.data?.deleted_count);
  } catch (error: any) {
    console.error('Operation failed:', error.message);
  } finally {
    await client.disconnect();
    console.log('Disconnected from AevumDB');
  }
}

main();
```

## Documentation

Explore the full capabilities of the AevumDB Node.js Driver with our comprehensive documentation:

-   [API Reference](docs/API.md) - Detailed documentation of all client methods and operations.
-   [Connection & Pooling Guide](docs/CONNECTION.md) - Learn about managing connections and configuring connection pools.
-   [Error Handling Guide](docs/ERRORS.md) - Understand error classes and best practices for robust error handling.
-   [Examples](examples/) - Browse runnable code examples to see the driver in action.
-   [Best Practices](docs/BEST_PRACTICES.md) - Discover recommendations for performance, security, and application design patterns.
-   [Support](SUPPORT.md) - Find information on how to get help and contribute.

## Features

The AevumDB Node.js Driver provides a rich set of features for interacting with your database.

### CRUD Operations

The driver offers a complete set of CRUD (Create, Read, Update, Delete) operations.

| Operation | Description | Read-Only | Read-Write | Admin |
|-----------|-------------|-----------|------------|-------|
| `insert()` | Inserts a new document into a collection. | No | Yes | Yes |
| `find()` | Queries documents with filtering, sorting, and pagination. | Yes | Yes | Yes |
| `update()` | Modifies existing documents based on a query. | No | Yes | Yes |
| `delete()` | Removes documents matching a specified query. | No | Yes | Yes |
| `count()` | Counts documents that match a given filter. | Yes | Yes | Yes |

### Admin Operations

Leverage administrative functionalities for database management.

| Operation    | Description                             |
|--------------|-----------------------------------------|
| `setSchema()` | Enables JSON Schema validation for a collection. |
| `createUser()` | Creates new database users with role-based access control. |

### Query Operators

A powerful set of operators for building flexible query filters.

```typescript
// Comparison operators for numerical or comparable values
{ age: { $gt: 25 } }        // Greater than
{ age: { $gte: 25 } }       // Greater than or equal to
{ age: { $lt: 60 } }        // Less than
{ age: { $lte: 60 } }       // Less than or equal to
{ age: { $eq: 30 } }        // Equal to
{ age: { $ne: 30 } }        // Not equal to

// Array operators for checking membership in array fields
{ tags: { $in: ['admin', 'moderator'] } }  // Value is present in the array
{ tags: { $nin: ['banned'] } }              // Value is not present in the array

// Implicit AND logic: Multiple conditions are combined with a logical AND
{ age: { $gte: 21 }, status: 'active' } // Equivalent to: age >= 21 AND status = 'active'
```

### Role-Based Access Control (RBAC)

Secure your application with fine-grained access control by creating users with specific roles.

```typescript
import { AevumClient, AevumUserRole } from '@aevumdb/node-driver';

const admin = new AevumClient({ apiKey: 'admin-master-key' }); // Connect with an admin key
await admin.connect();

// Create a read-only user for analytics
await admin.createUser('analytics-key', AevumUserRole.READ_ONLY);

// Create a read-write user for general application operations
await admin.createUser('app-user', AevumUserRole.READ_WRITE);

// Create another admin user for backup purposes
await admin.createUser('admin-backup', AevumUserRole.ADMIN);

await admin.disconnect();
```

### Schema Validation

Enforce data integrity and consistency using JSON Schemas for your collections.

```typescript
import { AevumClient } from '@aevumdb/node-driver';

async function main() {
  const client = new AevumClient({ apiKey: 'root' });
  await client.connect();

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      age: { type: 'integer', minimum: 0, maximum: 150 },
    },
    required: ['name', 'email'],
    additionalProperties: true,
  };

  await client.setSchema('users', schema);
  console.log('Schema set for users collection.');

  // Valid insert (conforms to schema)
  await client.insert('users', {
    name: 'Jane Doe',
    email: 'jane@example.com',
    age: 28,
  });
  console.log('Valid document inserted.');

  // Invalid insert (will fail schema validation)
  try {
    await client.insert('users', {
      name: 'John',
      age: 'invalid', // 'age' should be an integer
    });
  } catch (error: any) {
    console.error('Insert failed due to schema validation (expected):', error.message);
  } finally {
    await client.disconnect();
  }
}

main();
```

### Connection Pooling

Optimize performance and resource utilization for high-concurrency environments.

```typescript
import { AevumClient } from '@aevumdb/node-driver';

async function main() {
  // Single connection (default if poolSize is 0 or omitted)
  const singleClient = new AevumClient({
    host: '127.0.0.1',
    port: 55001,
    poolSize: 0,
  });
  await singleClient.connect();
  console.log('Single connection client connected.');
  await singleClient.disconnect();

  // Connection pool (recommended for high concurrency)
  const pooledClient = new AevumClient({
    host: '127.0.0.1',
    port: 55001,
    poolSize: 10, // 10 concurrent connections
    connectTimeout: 5000, // 5 seconds connection timeout
    queryTimeout: 10000, // 10 seconds per-query timeout
  });

  await pooledClient.connect();
  console.log('Pooled client connected.');

  // Get current connection pool statistics
  const stats = pooledClient.getPoolStats();
  if (stats) {
    console.log(`Pool Stats: Available: ${stats.available}, In use: ${stats.inUse}, Waiting: ${stats.waiting}`);
  }

  await pooledClient.disconnect();
  console.log('Pooled client disconnected.');
}

main();
```

### Error Handling

Implement robust error handling to build resilient applications.

```typescript
import {
  AevumClient,
  AevumError,
  AevumConnectionError,
  AevumAuthError,
  AevumOperationError,
  AevumTimeoutError,
  AevumValidationError,
} from '@aevumdb/node-driver';

async function main() {
  const client = new AevumClient({ apiKey: 'invalid-key' }); // Use an invalid key for demonstration

  try {
    await client.insert('users', { name: 'John' });
    console.log('Document inserted (this should not happen with invalid key).');
  } catch (error: any) {
    if (error instanceof AevumConnectionError) {
      console.error('Error: Connection failed -', error.message);
    } else if (error instanceof AevumAuthError) {
      console.error('Error: Authentication failed -', error.message);
    } else if (error instanceof AevumTimeoutError) {
      console.error('Error: Request timeout -', error.message);
    } else if (error instanceof AevumValidationError) {
      console.error('Error: Validation failed -', error.message);
    } else if (error instanceof AevumOperationError) {
      console.error(`Error: AevumDB Operation Failed [${error.code}] -`, error.message);
    } else if (error instanceof AevumError) {
      console.error(`Error: Generic AevumDB Error [${error.code}] -`, error.message);
    } else {
      console.error('Error: Unexpected error -', error);
    }
  } finally {
    await client.disconnect();
  }
}

main();
```

## Development

Instructions for setting up and working with the driver's source code.

### Build

Compile the TypeScript source code:

```bash
pnpm build
```

### Tests

Run unit and integration tests:

```bash
pnpm test           # Run all tests with coverage report
pnpm test:watch     # Run tests in watch mode for development
```

### Linting & Formatting

Ensure code quality and consistency:

```bash
pnpm lint           # Automatically fix ESLint issues
pnpm lint:check     # Check for ESLint issues without fixing
pnpm format         # Automatically format code using Prettier
pnpm format:check   # Check formatting issues without applying changes
```

### Type Checking

Verify TypeScript types:

```bash
pnpm typecheck
```

## Contributing

We welcome contributions from the community! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) guide for detailed guidelines on how to get involved.

## License

Copyright (c) 2026 Ananda Firmansyah. Licensed under the [AEVUMDB COMMUNITY LICENSE](LICENSE).
