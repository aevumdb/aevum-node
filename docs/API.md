# API Reference

Complete documentation of all AevumDB Node.js driver operations.

## Connection & Lifecycle

### `constructor(config?: AevumConnectionConfig)`

Initializes the `AevumClient` with optional configuration settings.

**Parameters:**
- `config`: Optional configuration object for the client.
  - `host?`: `string` - The server hostname (default: `'127.0.0.1'`).
  - `port?`: `number` - The server port (default: `55001`).
  - `apiKey?`: `string` - The authentication API key (default: `'root'`).
  - `poolSize?`: `number` - The connection pool size. A value of `0` indicates a single socket connection (default: `0`).
  - `connectTimeout?`: `number` - The connection timeout in milliseconds (default: `5000`).
  - `queryTimeout?`: `number` - The per-query timeout in milliseconds. A value of `0` disables the timeout (default: `0`).

**Example:**
```typescript
const client = new AevumClient({
  host: 'db.example.com',
  port: 55001,
  apiKey: 'prod-key',
  poolSize: 20,
  queryTimeout: 10000,
});
```

### `connect(): Promise<void>`

Establishes a connection to the AevumDB server. If connection pooling is enabled (`poolSize > 0`), all connections in the pool are established.

**Throws:**
- `AevumConnectionError`: If the connection fails or a timeout occurs during the connection attempt.

**Example:**
```typescript
try {
  await client.connect();
  console.log('Connected to AevumDB');
} catch (error: any) {
  console.error('Failed to connect:', error.message);
}
```

### `disconnect(): Promise<void>`

Gracefully disconnects from the server and releases all associated resources. This method sends an exit command before closing sockets, ensuring a clean shutdown.

**Example:**
```typescript
await client.disconnect();
```

---

## CRUD Operations

### `insert<T = any>(collection: string, document: Record<string, any>): Promise<AevumResponse<InsertResult>>`

Inserts a single document into the specified collection and returns the generated `_id`.

**Parameters:**
- `collection`: `string` - The name of the target collection.
- `document`: `Record<string, any>` - The JSON object to insert.

**Returns:**
- `Promise<AevumResponse<{ _id: string }>>`: A promise that resolves to an `AevumResponse` containing the `_id` of the newly inserted document.

**Throws:**
- `AevumConnectionError`: If there is a problem with the connection.
- `AevumAuthError`: If the API key is invalid or permissions are insufficient.
- `AevumOperationError`: If a schema validation error or another server-side error occurs.

**Example:**
```typescript
const result = await client.insert('users', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  age: 28,
  tags: ['admin', 'moderator'],
});

console.log('New user ID:', result.data?._id);
```

---

### `find<T = any>(collection: string, query?: QueryFilter, options?: FindOptions): Promise<AevumResponse<T[]>>`

Queries documents from the specified collection, allowing for filtering, sorting, and pagination.

**Parameters:**
- `collection`: `string` - The name of the target collection.
- `query?`: `QueryFilter` - Optional filter criteria. If omitted or an empty object (`{}`), all documents in the collection are considered (default: `{}`).
- `options?`: `FindOptions` - Optional query options.
  - `sort?`: `Record<string, 1 | -1>` - Specifies the sorting order. Use `1` for ascending and `-1` for descending.
  - `limit?`: `number` - The maximum number of results to return. A value of `0` means no limit.
  - `skip?`: `number` - The number of documents to skip from the beginning of the result set, used for pagination.

**Returns:**
- `Promise<AevumResponse<T[]>>`: A promise that resolves to an `AevumResponse` containing an array of matching documents.

**Query Filter Examples:**
```typescript
// Single field filter
await client.find('users', { status: 'active' });

// Comparison operators for numerical fields
await client.find('users', { age: { $gte: 21, $lt: 65 } });

// Array membership check
await client.find('users', { role: { $in: ['admin', 'moderator'] } });

// Multiple conditions (implicitly combined with AND)
await client.find('users', {
  age: { $gte: 21 },
  status: 'active',
  country: { $in: ['US', 'CA'] },
});
```

**Options Examples:**
```typescript
// Sorting and limiting for pagination
const page = await client.find(
  'users',
  { status: 'active' },
  {
    sort: { createdAt: -1 },
    limit: 20,
    skip: 0,
  }
);

// Fetching all users with a limit (no filter)
const allUsers = await client.find('users', {}, { limit: 100 });
```

---

### `update(collection: string, query: QueryFilter, update: Record<string, any>): Promise<AevumResponse<UpdateResult>>`

Updates documents in the specified collection that match the provided filter criteria. Returns the count of modified documents.

**Parameters:**
- `collection`: `string` - The name of the target collection.
- `query`: `QueryFilter` - The filter criteria to identify documents to update.
- `update`: `Record<string, any>` - An object containing the fields to update and their new values.

**Returns:**
- `Promise<AevumResponse<{ updated_count: number }>>`: A promise that resolves to an `AevumResponse` containing the number of documents that were updated.

**Example:**
```typescript
const result = await client.update(
  'users',
  { email: 'jane@example.com' },
  {
    age: 29,
    lastLogin: new Date().toISOString(),
    status: 'active',
  }
);

console.log(`Updated ${result.data?.updated_count} documents`);
```

---

### `delete(collection: string, query: QueryFilter): Promise<AevumResponse<DeleteResult>>`

Deletes documents from the specified collection that match the provided filter criteria. Returns the count of removed documents.

**Parameters:**
- `collection`: `string` - The name of the target collection.
- `query`: `QueryFilter` - The filter criteria to identify documents to delete.

**Returns:**
- `Promise<AevumResponse<{ deleted_count: number }>>`: A promise that resolves to an `AevumResponse` containing the number of documents that were deleted.

**Example:**
```typescript
const result = await client.delete('users', { status: 'inactive' });
console.log(`Deleted ${result.data?.deleted_count} users`);
```

---

### `count(collection: string, query?: QueryFilter): Promise<AevumResponse<CountResult>>`

Counts the number of documents in the specified collection that match the provided filter criteria.

**Parameters:**
- `collection`: `string` - The name of the target collection.
- `query?`: `QueryFilter` - Optional filter criteria. If omitted or an empty object (`{}`), all documents in the collection are counted (default: `{}`).

**Returns:**
- `Promise<AevumResponse<{ count: number }>>`: A promise that resolves to an `AevumResponse` containing the total count of matching documents.

**Example:**
```typescript
const active = await client.count('users', { status: 'active' });
console.log(`Active users: ${active.data?.count}`);

const total = await client.count('users');
console.log(`Total users: ${total.data?.count}`);
```

---

## Admin Operations

### `setSchema(collection: string, schema: SchemaDefinition): Promise<AevumResponse<SetSchemaResult>>`

Enables JSON Schema validation for a specific collection. After a schema is set, all subsequent insert and update operations on that collection will be validated against this schema.

**Parameters:**
- `collection`: `string` - The name of the target collection.
- `schema`: `SchemaDefinition` - The JSON Schema object to apply.

**Returns:**
- `Promise<AevumResponse<{ status: string }>>`: A promise that resolves to an `AevumResponse` indicating the status of the schema operation.

**Requires:** `ADMIN` role.

**Example:**
```typescript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0, maximum: 150 },
    status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
  },
  required: ['name', 'email'],
  additionalProperties: true,
};

await client.setSchema('users', schema);

// Valid insert (conforms to schema)
await client.insert('users', {
  name: 'Jane',
  email: 'jane@example.com',
  age: 28,
  status: 'active',
});

// Invalid insert (will fail schema validation)
try {
  await client.insert('users', {
    name: 'John',
    email: 'invalid-email',
    age: 'thirty', // 'age' should be an integer
  });
} catch (error: any) {
  console.error('Insert failed due to schema validation:', error.message);
}
```

---

### `createUser(userKey: string, role: AevumUserRole): Promise<AevumResponse<CreateUserResult>>`

Creates a new database user with specified role-based access control permissions.

**Parameters:**
- `userKey`: `string` - The API key for the new user.
- `role`: `AevumUserRole` - The role to assign to the new user.

**Role Permissions:**

| Role           | `insert` | `find` | `update` | `delete` | `count` | `setSchema` | `createUser` |
|----------------|----------|--------|----------|----------|---------|-------------|--------------|
| `READ_ONLY`    | No       | Yes    | No       | No       | Yes     | No          | No           |
| `READ_WRITE`   | Yes      | Yes    | Yes      | Yes      | Yes     | Yes         | No           |
| `ADMIN`        | Yes      | Yes    | Yes      | Yes      | Yes     | Yes         | Yes          |

**Returns:**
- `Promise<AevumResponse<{ status: string }>>`: A promise that resolves to an `AevumResponse` indicating the status of the user creation operation.

**Requires:** `ADMIN` role.

**Example:**
```typescript
const admin = new AevumClient({ apiKey: 'admin-master-key' });
await admin.connect();

// Create a read-only user for analytics purposes
await admin.createUser('analytics-key', AevumUserRole.READ_ONLY);

// Create a read-write user for general application operations
await admin.createUser('app-user-123', AevumUserRole.READ_WRITE);

// Create another administrative user for backup purposes
await admin.createUser('admin-backup', AevumUserRole.ADMIN);

await admin.disconnect();
```

---

## Utility Methods

### `getPoolStats(): PoolStats | null`

Returns current connection pool statistics if pooling is enabled. Returns `null` if the client is operating in single-socket mode (`poolSize` is 0).

**Returns:**
- `PoolStats | null`: An object containing pool statistics (`available`, `inUse`, `waiting`) or `null`.
```typescript
interface PoolStats {
  available: number;  // Number of sockets ready to use
  inUse: number;      // Number of sockets currently handling requests
  waiting: number;    // Number of requests waiting for an available socket
}
```

**Example:**
```typescript
const pooled = new AevumClient({ poolSize: 10 });
await pooled.connect();

setInterval(() => {
  const stats = pooled.getPoolStats();
  if (stats) {
    console.log(`Pool: ${stats.available} available, ${stats.inUse} in use, ${stats.waiting} waiting`);
  }
}, 5000);
```

---

## Response Format

All operations of the AevumDB Node.js driver return a standardized response envelope.

```typescript
interface AevumResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: string;
  };
}
```

**Success Response Example:**
```typescript
{
  status: 'success',
  message: 'Document inserted',
  data: { _id: 'uuid-string-here' }
}
```

**Error Response Example:**
```typescript
{
  status: 'error',
  message: 'Authentication failed',
  error: {
    code: 'AUTH_ERROR',
    details: 'API key not found or revoked'
  }
}
```

---

## Query Operators

### Comparison Operators

Used to compare values in query filters.

- `$gt`: Greater than
- `$gte`: Greater than or equal to
- `$lt`: Less than
- `$lte`: Less than or equal to
- `$eq`: Equal to
- `$ne`: Not equal to

**Examples:**
```typescript
await client.find('users', { age: { $gt: 21 } });
await client.find('users', { age: { $gte: 18, $lte: 65 } });
await client.find('products', { price: { $lt: 100 } });
```

### Array Operators

Used to query fields that contain arrays.

- `$in`: Value is present in the array.
- `$nin`: Value is not present in the array.

**Examples:**
```typescript
await client.find('users', { role: { $in: ['admin', 'moderator'] } });
await client.find('posts', { status: { $nin: ['deleted', 'spam'] } });
```

### Implicit AND

When multiple conditions are specified for different fields in a query filter, they are implicitly combined using a logical AND operation.

```typescript
// Equivalent to: age >= 21 AND age <= 65 AND status = 'active'
await client.find('users', {
  age: { $gte: 21, $lte: 65 },
  status: 'active',
});
```
