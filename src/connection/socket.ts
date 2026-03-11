// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

/**
 * @file src/connection/socket.ts
 * @brief Low-level TCP socket management for AevumDB connections
 */

import * as net from "net";
import { AevumConnectionError, AevumTimeoutError } from "../errors/aevum-error";

/**
 * TCP socket wrapper with Promise-based send/receive
 */
export class AevumSocket {
  private socket: net.Socket | null = null;
  private isConnecting = false;
  private connectTimeout: number;
  private queryTimeout: number;

  /**
   * @param host Server hostname
   * @param port Server port
   * @param connectTimeout Connection timeout in ms
   * @param queryTimeout Query timeout in ms (0 = disabled)
   */
  constructor(
    private readonly host: string,
    private readonly port: number,
    connectTimeout: number = 5000,
    queryTimeout: number = 0,
  ) {
    this.connectTimeout = connectTimeout;
    this.queryTimeout = queryTimeout;
  }

  /**
   * Checks if socket is connected
   */
  get isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  /**
   * Establishes TCP connection to server
   * @throws {AevumConnectionError} if connection fails
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;
    if (this.isConnecting) {
      throw new AevumConnectionError("Connection initialization already in progress");
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.isConnecting = false;
        this.socket?.destroy();
        this.socket = null;
        reject(new AevumTimeoutError(`Connection timeout to ${this.host}:${this.port}`));
      }, this.connectTimeout);

      this.socket = new net.Socket();

      this.socket.connect(this.port, this.host, () => {
        clearTimeout(timeout);
        this.isConnecting = false;
        // Optimize for latency
        this.socket!.setNoDelay(true);
        this.socket!.setKeepAlive(true, 5000);
        resolve();
      });

      this.socket.on("error", (err) => {
        clearTimeout(timeout);
        this.isConnecting = false;
        this.socket = null;
        reject(new AevumConnectionError(`Connection failed: ${err.message}`));
      });
    });
  }

  /**
   * Sends payload and waits for complete response
   * @param payload JSON string to send
   * @returns Server response as JSON string
   * @throws {AevumConnectionError} on network errors
   * @throws {AevumTimeoutError} on query timeout
   */
  async send(payload: string): Promise<string> {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      let buffer = "";
      let timeout: NodeJS.Timeout | null = null;

      if (this.queryTimeout > 0) {
        timeout = setTimeout(() => {
          cleanup();
          reject(new AevumTimeoutError("Query timeout"));
        }, this.queryTimeout);
      }

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        this.socket?.removeListener("data", dataHandler);
        this.socket?.removeListener("error", errorHandler);
        this.socket?.removeListener("close", closeHandler);
      };

      const dataHandler = (data: Buffer) => {
        buffer += data.toString("utf8");

        try {
          JSON.parse(buffer);
          cleanup();
          resolve(buffer);
        } catch {
          // JSON incomplete, wait for more data
        }
      };

      const errorHandler = (err: Error) => {
        cleanup();
        reject(new AevumConnectionError(`Socket error: ${err.message}`));
      };

      const closeHandler = () => {
        cleanup();
        if (buffer.length > 0) {
          resolve(buffer);
        } else {
          reject(new AevumConnectionError("Server closed connection"));
        }
      };

      this.socket!.on("data", dataHandler);
      this.socket!.on("error", errorHandler);
      this.socket!.on("close", closeHandler);

      try {
        this.socket!.write(payload + "\n");
      } catch (err) {
        cleanup();
        reject(new AevumConnectionError(`Failed to send payload: ${err}`));
      }
    });
  }

  /**
   * Closes socket connection
   */
  destroy(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}
