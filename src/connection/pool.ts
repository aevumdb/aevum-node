// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/connection/pool.ts
 * @brief Connection pooling for high-concurrency scenarios
 */

import { AevumSocket } from "./socket";
import { AevumConnectionError } from "../errors/aevum-error";

/**
 * Maintains pool of ready-to-use TCP sockets
 * Improves high-throughput performance by avoiding repeated handshakes
 */
export class ConnectionPool {
  private available: AevumSocket[] = [];
  private inUse: Set<AevumSocket> = new Set();
  private waitingQueue: Array<(socket: AevumSocket) => void> = [];
  private initialized = false;

  /**
   * @param size Maximum concurrent connections
   * @param host Server hostname
   * @param port Server port
   * @param connectTimeout Connection timeout in ms
   * @param queryTimeout Query timeout in ms
   */
  constructor(
    private readonly size: number,
    private readonly host: string,
    private readonly port: number,
    private readonly connectTimeout: number = 5000,
    private readonly queryTimeout: number = 0,
  ) {
    if (size < 1) {
      throw new AevumConnectionError("Pool size must be at least 1");
    }
  }

  /**
   * Initializes all sockets in pool
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.size; i++) {
      const socket = new AevumSocket(this.host, this.port, this.connectTimeout, this.queryTimeout);
      promises.push(
        socket.connect().then(() => {
          this.available.push(socket);
        }),
      );
    }

    try {
      await Promise.all(promises);
      this.initialized = true;
    } catch (err) {
      this.available = [];
      throw new AevumConnectionError(`Failed to initialize pool: ${err}`);
    }
  }

  /**
   * Acquires socket from pool
   * Waits if all sockets are in use
   */
  async acquire(): Promise<AevumSocket> {
    if (this.available.length > 0) {
      const socket = this.available.pop()!;
      this.inUse.add(socket);
      return socket;
    }

    return new Promise((resolve) => {
      this.waitingQueue.push((socket) => {
        this.inUse.add(socket);
        resolve(socket);
      });
    });
  }

  /**
   * Returns socket to available pool
   */
  release(socket: AevumSocket): void {
    this.inUse.delete(socket);

    if (this.waitingQueue.length > 0) {
      const resolve = this.waitingQueue.shift()!;
      resolve(socket);
    } else {
      this.available.push(socket);
    }
  }

  /**
   * Destroys all sockets and closes pool
   */
  destroy(): void {
    this.available.forEach((socket) => socket.destroy());
    this.inUse.forEach((socket) => socket.destroy());
    this.available = [];
    this.inUse.clear();
    this.waitingQueue = [];
    this.initialized = false;
  }

  /**
   * Gets current pool stats
   */
  getStats(): { available: number; inUse: number; waiting: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      waiting: this.waitingQueue.length,
    };
  }
}
