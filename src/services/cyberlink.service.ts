import { CosmWasmClient, IndexedTx, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import {
  ConfigResponse,
  Cyberlink,
  CyberlinkByFormattedIdResponse,
  CyberlinkResponse,
  CyberlinksByIdsResponse,
  CyberlinksByOwnerResponse,
  CyberlinksByOwnerTimeAnyResponse,
  CyberlinksByOwnerTimeResponse,
  CyberlinksResponse,
  CyberlinkState,
  DebugStateResponse,
  LastIdResponse,
  NamedCyberlinksResponse,
  TxCyberlinkResponseResult,
  TxResponse,
  TxStatusResponse,
} from '../types';

/**
 * Sanitizes query results by converting BigInt to string and handling undefined values
 * @param obj Any query result object
 * @returns Sanitized object
 */
const sanitizeQueryResult = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (typeof obj === 'function') return undefined;
  if (Array.isArray(obj)) return obj.map(sanitizeQueryResult);
  if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const sanitizedValue = sanitizeQueryResult(obj[key]);
        if (sanitizedValue !== undefined) {
          newObj[key] = sanitizedValue;
        }
      }
    }
    return newObj;
  }
  return obj;
};

/**
 * Service class for interacting with the CW-Social smart contract
 */
export class CyberlinkService {
  private cosmWasmClient: CosmWasmClient | null = null;
  private signingClient: SigningCosmWasmClient | null = null;
  private wallet: DirectSecp256k1HdWallet | null = null;
  private readonly nodeUrl: string;
  private readonly walletMnemonic: string;
  private readonly contractAddress: string;
  private readonly denom: string;

  /**
   * Creates a new CyberlinkService instance
   * @param nodeUrl Cosmos node URL
   * @param walletMnemonic Wallet mnemonic for signing transactions
   * @param contractAddress Smart contract address
   * @param denom Token denomination (defaults to 'stake')
   */
  constructor(nodeUrl: string, walletMnemonic: string, contractAddress: string, denom: string) {
    if (!nodeUrl) throw new Error('Missing NODE_URL environment variable');
    if (!walletMnemonic) throw new Error('Missing WALLET_MNEMONIC environment variable');
    if (!contractAddress) throw new Error('Missing CONTRACT_ADDRESS environment variable');

    this.nodeUrl = nodeUrl;
    this.walletMnemonic = walletMnemonic;
    this.contractAddress = contractAddress;
    this.denom = denom || 'stake';
  }

  /**
   * Initializes the service by setting up wallet and clients
   */
  async initialize(): Promise<void> {
    try {
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.walletMnemonic, {
        prefix: 'wasm',
      });

      this.cosmWasmClient = await CosmWasmClient.connect(this.nodeUrl);

      const gasPrice = GasPrice.fromString(`0.025${this.denom}`);

      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        this.nodeUrl,
        this.wallet,
        {
          gasPrice,
        }
      );
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to initialize service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private ensureInitialized(): void {
    if (!this.cosmWasmClient || !this.signingClient || !this.wallet) {
      throw new McpError(ErrorCode.InternalError, 'CyberlinkService not initialized');
    }
  }

  /**
   * Processes a cyberlink by stringifying its value
   * @param cyberlink Cyberlink to process
   * @returns Processed cyberlink
   */
  private processCyberlink(cyberlink: Cyberlink): Cyberlink {
    return {
      ...cyberlink,
      value: cyberlink.value ? JSON.stringify(cyberlink.value) : undefined,
    };
  }

  // CRUD OPERATIONS

  async createCyberlink(cyberlink: Cyberlink): Promise<TxResponse> {
    const msg = {
      create_cyberlink: {
        cyberlink: this.processCyberlink(cyberlink),
      },
    };
    return this.executeTx(msg);
  }

  async createNamedCyberlink(name: string, cyberlink: Cyberlink): Promise<TxResponse> {
    const msg = {
      create_named_cyberlink: {
        name,
        cyberlink: this.processCyberlink(cyberlink),
      },
    };
    return this.executeTx(msg);
  }

  async createCyberlinks(cyberlinks: Cyberlink[]): Promise<TxResponse> {
    const msg = {
      create_cyberlinks: {
        cyberlinks: cyberlinks.map((c) => this.processCyberlink(c)),
      },
    };
    return this.executeTx(msg);
  }

  async updateCyberlink(id: number, cyberlink: Cyberlink): Promise<TxResponse> {
    const msg = {
      update_cyberlink: {
        id,
        cyberlink: this.processCyberlink(cyberlink),
      },
    };
    return this.executeTx(msg);
  }

  async deleteCyberlink(id: number): Promise<TxResponse> {
    const msg = { delete_cyberlink: { id } };
    return this.executeTx(msg);
  }

  // QUERY OPERATIONS

  /**
   * Executes a query on the smart contract
   * @param queryMsg Query message
   * @param transform Whether to transform the results
   * @returns Query response
   */
  private async executeQuery<T>(
    queryMsg: Record<string, any>,
    transform: boolean = false
  ): Promise<T> {
    this.ensureInitialized();
    try {
      const result = await this.cosmWasmClient!.queryContractSmart(this.contractAddress, queryMsg);
      return (transform ? this.transformResults(result) : result) as T;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Creates pagination parameters for queries
   * @param startAfter Start cursor
   * @param limit Result limit
   * @returns Pagination parameters
   */
  private createPaginationParams(startAfter?: number | string, limit: number = 50) {
    return {
      start_after: startAfter,
      limit: Math.min(Math.max(1, limit), 100), // Ensure limit is between 1 and 100
    };
  }

  /**
   * Transforms query results into a record format
   * @param results Query results
   * @returns Transformed results
   */
  private transformResults(results: [number, CyberlinkState][]): Record<number, CyberlinkState> {
    return results.reduce(
      (acc, [id, state]) => {
        acc[id] = { ...state };
        return acc;
      },
      {} as Record<number, CyberlinkState>
    );
  }

  async queryCyberlinks(startAfter?: number, limit: number = 50): Promise<CyberlinksResponse> {
    return this.executeQuery<CyberlinksResponse>(
      { cyberlinks: this.createPaginationParams(startAfter, limit) },
      false
    );
  }

  async queryByFormattedId(formattedId: string): Promise<CyberlinkByFormattedIdResponse> {
    return this.executeQuery<CyberlinkByFormattedIdResponse>(
      { cyberlink_by_formatted_id: { formatted_id: formattedId } },
      false
    );
  }

  async queryByTimeRangeAny(
    owner: string,
    startTime: string,
    endTime?: string,
    startAfter?: number,
    limit: number = 50
  ): Promise<CyberlinksByOwnerTimeAnyResponse> {
    return this.executeQuery<CyberlinksByOwnerTimeAnyResponse>(
      {
        cyberlinks_by_owner_time_any: {
          owner,
          start_time: startTime,
          end_time: endTime,
          ...this.createPaginationParams(startAfter, limit),
        },
      },
      false
    );
  }

  async queryByTimeRange(
    owner: string,
    startTime: string,
    endTime?: string,
    startAfter?: number,
    limit: number = 50
  ): Promise<CyberlinksByOwnerTimeResponse> {
    return this.executeQuery<CyberlinksByOwnerTimeResponse>(
      {
        cyberlinks_by_owner_time: {
          owner,
          start_time: startTime,
          end_time: endTime,
          ...this.createPaginationParams(startAfter, limit),
        },
      },
      false
    );
  }

  async queryLastId(): Promise<LastIdResponse> {
    return this.executeQuery<LastIdResponse>({ last_id: {} }, false);
  }

  async queryDebugState(): Promise<DebugStateResponse> {
    return this.executeQuery<DebugStateResponse>({ debug_state: {} }, false);
  }

  async queryNamedCyberlinks(
    startAfter?: string,
    limit: number = 50
  ): Promise<NamedCyberlinksResponse> {
    return this.executeQuery<NamedCyberlinksResponse>(
      { named_cyberlinks: this.createPaginationParams(startAfter, limit) },
      false
    );
  }

  async queryByOwner(
    owner: string,
    startAfter?: number,
    limit: number = 50
  ): Promise<CyberlinksByOwnerResponse> {
    return this.executeQuery<CyberlinksByOwnerResponse>(
      {
        cyberlinks_by_owner: {
          owner,
          ...this.createPaginationParams(startAfter, limit),
        },
      },
      false
    );
  }

  async queryConfig(): Promise<ConfigResponse> {
    return this.executeQuery<ConfigResponse>({ config: {} }, false);
  }

  async queryById(id: number): Promise<CyberlinkResponse> {
    return this.executeQuery<CyberlinkResponse>({ cyberlink_by_id: { id } }, false);
  }

  async queryByIds(ids: number[]): Promise<CyberlinksByIdsResponse> {
    return this.executeQuery<CyberlinksByIdsResponse>({ cyberlinks_by_ids: { ids } }, false);
  }

  // TRANSACTION HANDLING

  private async waitForTransaction(
    txHash: string,
    timeoutMs: number = 30000,
    pollIntervalMs: number = 1000
  ): Promise<TxCyberlinkResponseResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getTxStatus(txHash);

      if (result.status === 'confirmed') {
        return result.result || {};
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Transaction failed');
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Transaction confirmation timed out after ${timeoutMs}ms`);
  }

  private async executeTx(msg: any): Promise<TxResponse> {
    try {
      this.ensureInitialized();
      const [sender] = await this.wallet!.getAccounts();

      if (!sender) {
        throw new Error('No accounts found');
      }

      const result = await this.signingClient!.execute(
        sender.address,
        this.contractAddress,
        msg,
        'auto'
      );

      const txResult = await this.waitForTransaction(result.transactionHash);

      const txInfo = {
        height: result.height,
        gasUsed: result.gasUsed,
        gasWanted: result.gasWanted,
      };

      return {
        transactionHash: result.transactionHash,
        status: 'completed',
        info: sanitizeQueryResult(txInfo),
        result: sanitizeQueryResult(txResult),
      };
    } catch (error) {
      return {
        transactionHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // WALLET OPERATIONS

  async queryWalletBalance(): Promise<{
    address: string;
    balances: { denom: string; amount: string }[];
  }> {
    this.ensureInitialized();
    const [account] = await this.wallet!.getAccounts();
    const balance = await this.signingClient!.getBalance(account.address, this.denom);

    return {
      address: account.address,
      balances: [balance],
    };
  }

  async sendTokens(
    recipient: string,
    amount: string,
    denom: string = this.denom
  ): Promise<TxResponse> {
    this.ensureInitialized();
    const [sender] = await this.wallet!.getAccounts();

    try {
      const result = await this.signingClient!.sendTokens(
        sender.address,
        recipient,
        [{ denom, amount }],
        'auto'
      );

      return {
        status: 'completed',
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      return {
        status: 'failed',
        transactionHash: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTxStatus(transactionHash: string): Promise<TxStatusResponse> {
    try {
      this.ensureInitialized();
      const tx = (await this.cosmWasmClient!.getTx(transactionHash)) as IndexedTx;

      if (!tx) {
        return { status: 'pending' };
      }

      const wasmEvent = tx.events.find((e) => e.type === 'wasm')?.attributes || [];

      const result: Record<string, string> = {};

      // Fields to extract from the transaction event
      ['numeric_id', 'numeric_ids', 'formatted_id', 'formatted_ids'].forEach((key) => {
        const value = wasmEvent.find((a) => a.key === key)?.value;
        if (value) {
          result[key] = value;
        }
      });

      if (tx.code === 0) {
        return {
          status: 'confirmed',
          result,
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
}
