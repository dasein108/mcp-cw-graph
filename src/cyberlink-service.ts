import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CosmWasmClient, SigningCosmWasmClient, IndexedTx } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';
import { 
  TxResponse, 
  TxStatusResponse,
  CyberlinkState,
  ConfigResponse,
  Cyberlink,
  NamedCyberlink
} from './types';


      // Process the result to sanitize it for JSON serialization
const sanitizeResult = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (typeof obj === 'function') {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeResult);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const sanitizedValue = sanitizeResult(obj[key]);
        if (sanitizedValue !== undefined) {
          newObj[key] = sanitizedValue;
        }
      }
    }
    return newObj;
  }
  
  return obj;
};


export class CyberlinkService {
  private cosmWasmClient: CosmWasmClient | null = null;
  private signingClient: SigningCosmWasmClient | null = null;
  private wallet: DirectSecp256k1HdWallet | null = null;
  private readonly nodeUrl: string;
  private readonly walletMnemonic: string;
  private readonly contractAddress: string;
  private readonly denom: string;

  constructor(nodeUrl: string, walletMnemonic: string, contractAddress: string, denom: string) {

    // Validate required environment variables
    if (!nodeUrl) throw new Error('Missing NODE_URL environment variable');
    if (!walletMnemonic) throw new Error('Missing WALLET_MNEMONIC environment variable');
    if (!contractAddress) throw new Error('Missing CONTRACT_ADDRESS environment variable');
    
    this.nodeUrl = nodeUrl;
    this.walletMnemonic = walletMnemonic;
    this.contractAddress = contractAddress;
    this.denom = denom || 'stake';
  }

  async initialize(): Promise<void> {
    this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.walletMnemonic, {
      prefix: 'wasm'
    });
    
    this.cosmWasmClient = await CosmWasmClient.connect(this.nodeUrl);
    
    // Create gas price configuration
    const gasPrice = GasPrice.fromString(`0.025${this.denom}`);
    
    this.signingClient = await SigningCosmWasmClient.connectWithSigner(
      this.nodeUrl,
      this.wallet,
      { gasPrice }
    );
  }

  // CRUD OPERATIONS

  async createCyberlink(cyberlink: Cyberlink): Promise<TxResponse> {
    const msg = {
      create_cyberlink: { cyberlink }
    };
    return this.executeTx(msg);
  }

  async createNamedCyberlink(name: string, cyberlink: Cyberlink): Promise<TxResponse> {
    const msg = {
      create_named_cyberlink: { name, cyberlink }
    };
    return this.executeTx(msg);
  }

  async createCyberlinks(cyberlinks: Cyberlink[]): Promise<TxResponse> {
    const msg = {
      create_cyberlinks: { cyberlinks }
    };
    return this.executeTx(msg);
  }

  async updateCyberlink(id: number, cyberlink: Cyberlink): Promise<TxResponse> {
    const msg = {
      update_cyberlink: { id, cyberlink }
    };
    return this.executeTx(msg);
  }

  async deleteCyberlink(id: number): Promise<TxResponse> {
    const msg = {
      delete_cyberlink: { id }
    };
    return this.executeTx(msg);
  }

  // RESULT TRANSFORMERS

  /**
   * Transforms [id, CyberlinkState][] results to an object with ID as key and CyberlinkState as value
   */
  private transformResults(results: [number, CyberlinkState][]): Record<number, CyberlinkState> {
    return results.reduce((acc, [id, state]) => {
      acc[id] = { ...state };
      return acc;
    }, {} as Record<number, CyberlinkState>);
  }

  // QUERY METHODS

  private async executeQuery<T>(
    queryMsg: Record<string, any>,
    transform: boolean = true
  ): Promise<T> {
    this.ensureInitialized();
    try {
      const result = await this.cosmWasmClient!.queryContractSmart(this.contractAddress, queryMsg);
      return (transform ? this.transformResults(result) : result) as T;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async queryCyberlinks(startAfter?: number | string, limit?: number): Promise<Record<number, CyberlinkState>> {
    return this.executeQuery(
      { cyberlinks: { start_after: startAfter, limit } },
    );
  }

  async queryByFormattedId(formattedId: string): Promise<Record<number, CyberlinkState>> {
    return this.executeQuery(
      { cyberlink_by_formatted_id: { formatted_id: formattedId } },
    );
  }

  async queryByTimeRangeAny(
    owner: string,
    startTime: number | string,
    endTime?: number | string,
    startAfter?: number | string,
    limit?: number
  ): Promise<Record<number, CyberlinkState>> {
    return this.executeQuery(
      {
        cyberlinks_by_owner_time_any: {
          owner,
          start_time: startTime,
          end_time: endTime,
          start_after: startAfter,
          limit
        }
      },
    );
  }

  async queryLastId(): Promise<{ last_id: number }> {
    return this.executeQuery(
      { last_id: {} },
      false
    );
  }

  async queryDebugState(): Promise<Record<string, any>> {
    return this.executeQuery(
      { debug_state: {} },
      false
    );
  }

  async queryNamedCyberlinks(startAfter?: string, limit?: number): Promise<NamedCyberlink[]> {
    const result = await this.executeQuery<[string, number][]>(
      { named_cyberlinks: { start_after: startAfter, limit } },
      false
    );
    return result.map(([name, id]) => ({ id, name }));
  }

  async queryByOwner(owner: string, startAfter?: number | string, limit?: number): Promise<Record<number, CyberlinkState>> {
    return this.executeQuery(
      {
        cyberlinks_by_owner: {
          owner,
          start_after: startAfter,
          limit
        }
      },
    );
  }

  async queryConfig(): Promise<ConfigResponse> {
    return this.executeQuery(
      { config: {} },
      false
    );
  }

  async queryById(id: number): Promise<Record<number, CyberlinkState>> {
    return this.executeQuery(
      { cyberlink_by_id: { id } },
    );
  }

  async queryByIds(ids: number[]): Promise<Record<number, CyberlinkState>> {
    return this.executeQuery(
      { cyberlinks_by_ids: { ids } },
    );
  }

  async getTxStatus(transactionHash: string): Promise<TxStatusResponse> {
    try {
      this.ensureInitialized();
      const tx = await this.cosmWasmClient!.getTx(transactionHash) as IndexedTx;
      
      if (!tx) {
        return { status: 'pending' };
      }
      
      const wasmEvent = tx.events.find((e) => e.type === 'wasm')?.attributes || [];
      const numericId = wasmEvent.find((a: { key: string; value: string }) => a.key === 'numeric_id')?.value;
      const formattedId = wasmEvent.find((a: { key: string; value: string }) => a.key === 'formatted_id')?.value;

      if (tx.code === 0) {
        return {
          status: 'confirmed',
          ...(numericId && { numeric_id: numericId }),
          ...(formattedId && { formatted_id: formattedId })
        };
      }

      return {
        status: 'failed',
        error: String(tx.code) || 'Transaction failed'
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        'Failed to query transaction',
        { error }
      );
    }
  }

  async queryWalletBalance(): Promise<{address: string, balances: {denom: string, amount: string}[]}> {
    this.ensureInitialized();
    const [account] = await this.wallet!.getAccounts();
    const address = account.address;
    const balance = await this.signingClient!.getBalance(address, this.denom);
    const {denom, amount} = balance;
    
    
    return {
      address,
      balances: [{denom, amount}]
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
        [{denom, amount}],
        'auto'
      );

      return {
        status: 'completed',
        transactionHash: result.transactionHash
      };
    } catch (error) {
      return {
        status: 'failed',
        transactionHash: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // HELPER METHODS

  private ensureInitialized(): void {
    if (!this.cosmWasmClient || !this.signingClient || !this.wallet) {
      throw new Error('CyberlinkService not initialized');
    }
  }

  private async waitForTransaction(txHash: string, timeoutMs: number = 30000, pollIntervalMs: number = 1000): Promise<{numeric_id?: string, formatted_id?: string}> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getTxStatus(txHash);
      
      if (status.status === 'confirmed') {
        return {
          numeric_id: status.numeric_id,
          formatted_id: status.formatted_id
        };
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Transaction failed');
      }
      
      // Wait for the polling interval
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    throw new Error(`Transaction confirmation timed out after ${timeoutMs}ms`);
  }

  private async executeTx(msg: any): Promise<TxResponse> {
    try {
      this.ensureInitialized();
      const accounts = await this.wallet!.getAccounts();
      
      if (!accounts.length) {
        throw new Error('No accounts found');
      }

      const senderAddress = accounts[0].address;
      const result = await this.signingClient!.execute(
        senderAddress,
        this.contractAddress,
        msg,
        'auto'
      );
      
      // Wait for transaction confirmation and get IDs
      const txResult = await this.waitForTransaction(result.transactionHash);
      
      // Extract only the essential information from the result
      const simplifiedResult = {
        transactionHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed,
        gasWanted: result.gasWanted,
        ...txResult // Include numeric_id and formatted_id
      };
      
      return { 
        transactionHash: result.transactionHash,
        status: 'completed',
        result: sanitizeResult(simplifiedResult)
      };
    } catch (error) {
      return {
        transactionHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 