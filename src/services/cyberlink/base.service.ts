/**
 * Base service class with common functionality
 */
import { IndexedTx } from '@cosmjs/stargate';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { TxCyberlinkResponseResult, TxStatusResponse } from './types';
import { sanitizeQueryResult } from './utils';

// Fields to extract from cyberlink event
const FIELD_NAMES = ['gid', 'gids', 'fid', 'fids'];

export abstract class CyberlinkBaseService {
  protected readonly contractAddress: string;

  constructor(contractAddress: string) {
    if (!contractAddress) throw new Error('Missing CONTRACT_ADDRESS');
    this.contractAddress = contractAddress;
  }

  protected abstract ensureInitialized(): void;

  protected abstract getTx(transactionHash: string): Promise<IndexedTx | null>;

  protected async getTxStatus(transactionHash: string): Promise<TxStatusResponse> {
    try {
      this.ensureInitialized();
      const tx = await this.getTx(transactionHash);

      if (!tx) {
        return { status: 'pending' };
      }

      const wasmEvent = tx.events.find((e) => e.type === 'wasm')?.attributes || [];

      const result: Record<string, string> = {};

      FIELD_NAMES.forEach((key) => {
        const value = wasmEvent.find((a) => a.key === key)?.value;
        if (value) {
          result[key] = value;
        }
      });

      if (tx.code === 0) {
        return {
          status: 'confirmed',
          result: { ...result, transaction_hash: transactionHash },
        };
      }

      return {
        status: 'failed',
        error: String(tx.code) || 'Transaction failed',
      };
    } catch (error) {
      throw new McpError(ErrorCode.InternalError, 'Failed to query transaction', { error });
    }
  }

  public async waitForTransaction(
    txHash: string,
    timeoutMs: number = 30000,
    pollIntervalMs: number = 1000
  ): Promise<TxCyberlinkResponseResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await this.getTxStatus(txHash);

        if (result.status === 'confirmed') {
          return sanitizeQueryResult(result.result || { transaction_hash: txHash });
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'Transaction failed');
        }
      } catch (error) {
        console.error(`Error while polling transaction ${txHash}:`, error);
        // Continue polling if transaction not found
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Transaction confirmation timed out after ${timeoutMs}ms`);
  }
}
