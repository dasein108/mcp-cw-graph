import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { IndexedTx } from '@cosmjs/stargate';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { CyberlinkBaseService } from './base.service';
import {
  ConfigResponse,
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
} from './types';
import { removeEmptyValues } from './utils';

/**
 * Service class for read-only operations on the CW-Social smart contract
 */

export class CyberlinkQueryService extends CyberlinkBaseService {
  private cosmWasmClient: CosmWasmClient | null = null;
  private readonly nodeUrl: string;

  constructor(nodeUrl: string, contractAddress: string) {
    super(contractAddress);
    if (!nodeUrl) throw new Error('Missing NODE_URL');
    this.nodeUrl = nodeUrl;
  }

  async initialize(): Promise<void> {
    try {
      this.cosmWasmClient = await CosmWasmClient.connect(this.nodeUrl);
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to initialize query service: ${
          error instanceof Error ? error.message : 'Unknown error'
        }\r\nnodeUrl: ${this.nodeUrl} [ ${this.contractAddress} ] `
      );
    }
  }

  protected ensureInitialized(): void {
    if (!this.cosmWasmClient) {
      throw new McpError(ErrorCode.InternalError, 'CyberlinkQueryService not initialized');
    }
  }

  protected async getTx(transactionHash: string): Promise<IndexedTx | null> {
    return this.cosmWasmClient!.getTx(transactionHash);
  }

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

  // QUERY OPERATIONS
  async queryCyberlinks(startAfter?: number, limit: number = 50): Promise<CyberlinksResponse> {
    return this.executeQuery<CyberlinksResponse>(
      { cyberlinks: this.createPaginationParams(startAfter, limit) },
      false
    );
  }

  async queryByFormattedId(fid: string): Promise<CyberlinkByFormattedIdResponse> {
    return this.executeQuery<CyberlinkByFormattedIdResponse>(
      { cyberlink_by_f_i_d: { fid: fid } },
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
    return this.executeQuery<LastIdResponse>({ last_g_i_d: {} }, false);
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

  async queryById(gid: string): Promise<CyberlinkResponse> {
    return this.executeQuery<CyberlinkResponse>({ cyberlink_by_g_i_d: { gid } }, false);
  }

  async queryByIds(gids: string[]): Promise<CyberlinksByIdsResponse> {
    return this.executeQuery<CyberlinksByIdsResponse>({ cyberlinks_by_g_i_ds: { gids } }, false);
  }

  async queryCyberlinksByType(
    type: string,
    startAfterGid?: number,
    limit: number = 50
  ): Promise<CyberlinksResponse> {
    return this.executeQuery<CyberlinksResponse>(
      { cyberlinks_by_type: { type, ...this.createPaginationParams(startAfterGid, limit) } },
      false
    );
  }

  async queryCyberlinksByFrom(
    from: string,
    startAfterGid?: number,
    limit: number = 50
  ): Promise<CyberlinksResponse> {
    return this.executeQuery<CyberlinksResponse>(
      { cyberlinks_by_from: { from, ...this.createPaginationParams(startAfterGid, limit) } },
      false
    );
  }

  async queryCyberlinksByTo(
    to: string,
    startAfterGid?: number,
    limit: number = 50
  ): Promise<CyberlinksResponse> {
    return this.executeQuery<CyberlinksResponse>(
      { cyberlinks_by_to: { to, ...this.createPaginationParams(startAfterGid, limit) } },
      false
    );
  }

  async queryCyberlinksByOwnerTime(
    owner: string,
    startTime: string,
    endTime?: string,
    startAfterGid?: number,
    limit: number = 50
  ): Promise<CyberlinksByOwnerTimeResponse> {
    return this.executeQuery<CyberlinksByOwnerTimeResponse>(
      {
        cyberlinks_by_owner_time: {
          owner,
          start_time: startTime,
          end_time: endTime,
          ...this.createPaginationParams(startAfterGid, limit),
        },
      },
      false
    );
  }

  async queryCyberlinksByOwnerTimeAny(
    owner: string,
    startTime: string,
    endTime?: string,
    startAfterGid?: number,
    limit: number = 50
  ): Promise<CyberlinksByOwnerTimeAnyResponse> {
    return this.executeQuery<CyberlinksByOwnerTimeAnyResponse>(
      {
        cyberlinks_by_owner_time_any: {
          owner,
          start_time: startTime,
          end_time: endTime,
          ...this.createPaginationParams(startAfterGid, limit),
        },
      },
      false
    );
  }

  async getGraphStats(
    owner?: string,
    type?: string
  ): Promise<{
    owner_count?: string;
    type_count?: string;
    owner_type_count?: string;
  }> {
    return this.executeQuery(
      {
        get_graph_stats: removeEmptyValues({
          owner,
          type,
        }),
      },
      false
    );
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
    return results.reduce((acc, [id, state]) => {
      acc[id] = { ...state };
      return acc;
    }, {} as Record<number, CyberlinkState>);
  }

  // Add a public wrapper for getTxStatus
  public async getTxStatus(transactionHash: string): Promise<import('./types').TxStatusResponse> {
    return super.getTxStatus(transactionHash);
  }

  async queryCyberlinksByOwnerAndType(
    owner: string,
    type: string,
    startAfterGid?: number,
    limit: number = 50
  ): Promise<CyberlinksResponse> {
    return this.executeQuery<CyberlinksResponse>(
      {
        cyberlinks_by_owner_and_type: {
          owner,
          type,
          ...this.createPaginationParams(startAfterGid, limit),
        },
      },
      false
    );
  }
}
