import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice, IndexedTx } from '@cosmjs/stargate';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { CyberlinkBaseService } from './base.service';
import { TxResponse } from './types';
import { sanitizeQueryResult } from './utils';

/**
 * Service class for executing transactions on the CW-Social smart contract
 */
export class CyberlinkTxService extends CyberlinkBaseService {
  private signingClient: SigningCosmWasmClient | null = null;
  private wallet: DirectSecp256k1HdWallet | null = null;
  private readonly nodeUrl: string;
  private readonly walletMnemonic: string;
  private readonly denom: string;
  private readonly prefix: string;
  constructor(
    nodeUrl: string,
    walletMnemonic: string,
    contractAddress: string,
    denom: string,
    prefix: string
  ) {
    super(contractAddress);
    if (!nodeUrl) throw new Error('Missing NODE_URL');
    if (!walletMnemonic) throw new Error('Missing WALLET_MNEMONIC');

    this.nodeUrl = nodeUrl;
    this.walletMnemonic = walletMnemonic;
    this.denom = denom || 'stake';
    this.prefix = prefix || 'cyber';
  }

  async initialize(): Promise<void> {
    try {
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(this.walletMnemonic, {
        prefix: this.prefix,
      });

      const gasPrice = GasPrice.fromString(`0.15${this.denom}`);

      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        this.nodeUrl,
        this.wallet,
        {
          gasPrice,
        }
      );
    } catch (error) {
      const errorMessage = [
        'Failed to initialize transaction service:',
        error instanceof Error ? error.message : 'Unknown error',
        `nodeUrl: ${this.nodeUrl} [ ${this.contractAddress} ]`,
        error instanceof Error && error.stack ? `Stack trace:\n${error.stack}` : '',
      ].join('\n');

      throw new McpError(ErrorCode.InternalError, errorMessage);
    }
  }

  protected ensureInitialized(): void {
    if (!this.signingClient || !this.wallet) {
      throw new McpError(ErrorCode.InternalError, 'CyberlinkTxService not initialized');
    }
  }

  protected async getTx(transactionHash: string): Promise<IndexedTx | null> {
    return this.signingClient!.getTx(transactionHash);
  }

  async executeTx(msg: any): Promise<TxResponse> {
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
        transactionHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed,
        gasWanted: result.gasWanted,
      };

      return {
        status: 'completed',
        info: sanitizeQueryResult(txInfo),
        result: txResult,
      };
    } catch (error) {
      return {
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
      const txInfo = {
        transactionHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed,
        gasWanted: result.gasWanted,
      };

      return {
        status: 'completed',
        info: txInfo,
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
