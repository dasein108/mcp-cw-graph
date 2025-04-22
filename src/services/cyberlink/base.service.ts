/**
 * Base service class with common functionality
 */
export abstract class CyberlinkBaseService {
  protected readonly contractAddress: string;

  constructor(contractAddress: string) {
    if (!contractAddress) throw new Error('Missing CONTRACT_ADDRESS');
    this.contractAddress = contractAddress;
  }
}
