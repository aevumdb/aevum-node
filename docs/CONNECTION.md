# Connection & Pooling

Comprehensive guide to managing connections and configuring connection pools.

## Single Connection

Default mode suitable for:
- CLI tools and scripts
- Low-concurrency applications  
- Testing and development

```typescript
const client = new AevumClient({
  host: '127.0.0.1',
  port: 55001,
  apiKey: 'root',
  // poolSize omitted or set to 0 (default)
});

await client.connect();
await client.insert('users', { name: 'John' });
await client.disconnect();
```

### Single Connection Lifecycle

1. **Initialize** - Client constructor creates socket instance
2. **Connect** - Establishes TCP connection on first operation or explicit `connect()`
3. **Operations** - All requests use same socket sequentially
4. **Disconnect** - Closes socket and releases resources

### When to Use Single Connection

- ✅ Simple scripts and CLI tools
- ✅ Low-frequency operations (< 10 req/sec)
- ✅ Testing and development
- ✅ Single-threaded applications

### Limitations

- ❌ Cannot handle concurrent requests (waits for previous to complete)
- ❌ Only one operation at a time
- ❌ Poor performance with multiple simultaneous users

---

## Connection Pooling

Advanced mode for:
- High-concurrency web applications
- Microservices and APIs
- Production deployments
- Multiple concurrent users

```typescript
const client = new AevumClient({
  host: '127.0.0.1',
  port: 55001,
  apiKey: 'root',
  poolSize: 10, // Create 10 concurrent connections
  connectTimeout: 5000,
  queryTimeout: 10000,
});

await client.connect();

// Requests can now execute concurrently
const [r1, r2, r3] = await Promise.all([
  client.insert('users', { name: 'Alice' }),
  client.insert('users', { name: 'Bob' }),
  client.insert('users', { name: 'Carol' }),
]);

await client.disconnect();
```

### Pool Lifecycle

1. **Initialize** - Constructor creates pool instance
2. **Connect** - `connect()` establishes all socket connections in parallel
3. **Acquire** - Operation requests socket from available pool
4. **Execute** - Request runs on acquired socket
5. **Release** - Socket returned to available pool
6. **Disconnect** - All sockets destroyed and pool cleaned up

### Pool Statistics

Monitor pool performance in real-time:

```typescript
const stats = client.getPoolStats();
if (stats) {
  console.log(`Available: ${stats.available}`);  // Sockets ready to use
  console.log(`In Use: ${stats.inUse}`);         // Currently handling requests
  console.log(`Waiting: ${stats.waiting}`);      // Requests waiting for socket
}

// Example monitor
setInterval(() => {
  const stats = client.getPoolStats();
  if (stats) {
    const utilization = (stats.inUse / 10) * 100;
    console.log(`Pool utilization: ${utilization.toFixed(1)}%`);

    if (stats.waiting > 0) {
      console.warn(`${stats.waiting} requests waiting for connection`);
    }
  }
}, 5000);
```

### Sizing the Pool

**Formula:**
```
pool_size = (avg_response_time_ms / 1000) * requests_per_second + buffer
```

**Examples:**

| Workload | Avg Latency | Requests/sec | Pool Size | Notes |
|----------|------------|--------------|-----------|-------|
| Low | 50ms | 10 | 3-5 | CLI, tests |
| Medium | 100ms | 100 | 15-20 | Small API |
| High | 150ms | 500 | 75-100 | Production API |
| Very High | 200ms | 1000+ | 200+ | Scaling service |

**Conservative approach:**
```typescript
const poolSize = Math.ceil(expectedConcurrentRequests * 1.5);
const client = new AevumClient({ poolSize });
```

### When to Use Connection Pooling

- ✅ Web servers and APIs (Express, Fastify, etc.)
- ✅ High-concurrency applications (100+ simultaneous users)
- ✅ Production deployments
- ✅ Microservices architecture
- ✅ Batch operations with parallelism

### Avoiding Pool Exhaustion

```typescript
const client = new AevumClient({ poolSize: 5 });
await client.connect();

// ❌ BAD: Creates 100 concurrent requests with only 5 sockets
// 95 will queue, potentially timing out
Promise.all(Array(100).fill(null).map(() => 
  client.insert('users', { name: 'User' })
));

// ✅ GOOD: Batch in chunks with pool size
async function batchInsert(documents, chunkSize = 5) {
  for (let i = 0; i < documents.length; i += chunkSize) {
    const chunk = documents.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(doc => client.insert('users', doc))
    );
  }
}
```

---

## Configuration Options

### Connection Timeout

Time allowed for initial TCP connection:

```typescript
const client = new AevumClient({
  host: 'db.example.com',
  port: 55001,
  connectTimeout: 5000, // 5 seconds (default)
});

// With slower or distant server
const slowClient = new AevumClient({
  connectTimeout: 15000, // 15 seconds
});
```

### Query Timeout

Per-operation timeout for all CRUD operations:

```typescript
const client = new AevumClient({
  queryTimeout: 10000, // 10 seconds timeout per query
});

try {
  // Will timeout if operation takes > 10 seconds
  const users = await client.find('users');
} catch (error) {
  if (error instanceof AevumTimeoutError) {
    console.error('Query timeout exceeded');
  }
}
```

### Multiple Clients

For multi-tenant or complex architectures:

```typescript
// Admin client with full access
const admin = new AevumClient({
  apiKey: 'admin-key',
  poolSize: 10,
});

// Read-only client for analytics
const analytics = new AevumClient({
  apiKey: 'analytics-key',
  poolSize: 20, // Higher pool for many queries
});

// App client for user operations
const app = new AevumClient({
  apiKey: 'app-key',
  poolSize: 30,
  queryTimeout: 5000, // Strict timeout for user-facing ops
});

await Promise.all([
  admin.connect(),
  analytics.connect(),
  app.connect(),
]);
```

---

## Common Patterns

### Express.js Integration

```typescript
import express from 'express';
import { AevumClient, AevumError } from '@aevumdb/node-driver';

const app = express();
const client = new AevumClient({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '55001'),
  apiKey: process.env.DB_API_KEY || 'root',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
  queryTimeout: 10000,
});

// Middleware to initialize connection
app.use(async (req, res, next) => {
  if (!client.isConnected) {
    await client.connect();
  }
  req.db = client;
  next();
});

// Route using database
app.get('/users', async (req, res) => {
  try {
    const result = await client.find('users', {}, { limit: 100 });
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error instanceof AevumError ? error.message : 'Unknown error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await client.disconnect();
  process.exit(0);
});

app.listen(3000);
```

### Worker Pool with Queue

```typescript
import pQueue from 'p-queue';

const queue = new pQueue({ concurrency: 5 });
const client = new AevumClient({ poolSize: 5 });
await client.connect();

// Queue operations instead of overwhelming pool
async function queueInsert(collection, document) {
  return queue.add(() => client.insert(collection, document));
}

// Peak throughput is controlled by queue concurrency
for (let i = 0; i < 1000; i++) {
  queueInsert('users', { id: i });
}
```

### Reconnection with Circuit Breaker

```typescript
class ResilientAevumClient {
  private failures = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60_000;

  constructor(private client: AevumClient) {}

  private async withCircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failures >= this.failureThreshold) {
      throw new Error('Circuit breaker open - too many failures');
    }

    try {
      const result = await fn();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.failureThreshold) {
        console.error('Circuit breaker tripped, waiting for reset...');
        setTimeout(() => {
          this.failures = 0;
          console.log('Circuit breaker reset');
        }, this.resetTimeout);
      }
      throw error;
    }
  }

  async insert(collection: string, document: any) {
    return this.withCircuitBreaker(() => this.client.insert(collection, document));
  }

  // ... other operations similarly wrapped
}
```

---

## Troubleshooting

### "Connection timeout"
- ✅ Verify server is running: `telnet localhost 55001`
- ✅ Check firewall/network settings
- ✅ Increase connectTimeout if server is slow

### "Connection refused"
- ✅ Verify host and port are correct
- ✅ Ensure AevumDB server is running
- ✅ Check if port binding is correct

### "Pool exhausted / requests waiting"
- ✅ Increase pool size: `poolSize: 20`
- ✅ Implement request queueing
- ✅ Optimize queries to reduce latency
- ✅ Profile database performance

### "Query timeout"
- ✅ Increase queryTimeout if operations are slow
- ✅ Add indexes to speed up queries
- ✅ Reduce result set size with limit/skip
- ✅ Check for slow queries on server
