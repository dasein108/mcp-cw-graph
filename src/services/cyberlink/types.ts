// Basic Types
export type Uint64 = string;
export type Timestamp = string;

/**
 * Value structure for cyberlinks that can include content, embeddings, and tags
 */
export type CyberlinkValue = {
  content?: string;
  embedding?: number[];
  tags?: string[];
};

// Core Types
/**
 * Base cyberlink interface for creating and updating cyberlinks
 */
export interface Cyberlink {
  type: string; // Required - Type of the relationship
  from?: string; // Optional - Source fid
  to?: string; // Optional - Target fid
  value?: string; // Optional - JSON stringified CyberlinkValue
}

/**
 * Named cyberlink mapping interface
 */
export interface NamedCyberlink {
  gid: number; // Required - Numeric ID
  name: string; // Required - Name identifier (fid or type)
}

/**
 * Extended cyberlink state with metadata
 */
export interface CyberlinkState extends Cyberlink {
  gid?: number; // Numeric ID
  owner: string; // Owner's wallet address
  created_at: Timestamp; // Creation timestamp
  updated_at?: Timestamp | null; // Last update timestamp
  fid?: string | null; // Formatted string identifier
}

// Query Parameters
export interface CyberlinksParams {
  start_after?: number; // Pagination cursor
  limit?: number; // Result limit
}

export interface NamedCyberlinksParams {
  start_after?: string; // Pagination cursor
  limit?: number; // Result limit
}

export interface CyberlinksByOwnerParams {
  owner: string; // Owner's wallet address
  start_after?: number; // Pagination cursor
  limit?: number; // Result limit
}

export interface CyberlinksByOwnerTimeParams {
  owner: string; // Owner's wallet address
  start_time: Timestamp; // Start timestamp
  end_time?: Timestamp; // Optional end timestamp
  start_after?: number; // Pagination cursor
  limit?: number; // Result limit
}

// Response Types
export interface TxResponse {
  status: 'completed' | 'pending' | 'failed'; // Transaction status
  result?: Record<string, any>; // Optional result data
  info?: Record<string, any>; // Optional transaction info
  error?: string; // Optional error message
}

export interface TxCyberlinkResponseResult {
  transaction_hash: string; // Transaction hash
  gid?: string; // Created/updated cyberlink ID
  fid?: string; // Created/updated formatted ID
  gids?: string[]; // Batch operation IDs
  fids?: string[]; // Batch operation formatted IDs
}

export interface TxStatusResponse {
  status: 'pending' | 'confirmed' | 'failed'; // Transaction status
  result?: TxCyberlinkResponseResult; // Optional result data
  error?: string; // Optional error message
}

export interface ConfigResponse {
  admins: string[]; // Admin wallet addresses
  executors: string[]; // Executor wallet addresses
}

export interface StateResponse {
  cyberlinks: [number, CyberlinkState][]; // All cyberlinks
  named_cyberlinks: [string, number][]; // All named cyberlinks
}

// Query Response Types
export type LastIdResponse = Uint64; // Last assigned cyberlink ID
export type DebugStateResponse = StateResponse; // Full contract state
export type CyberlinkResponse = CyberlinkState; // Single cyberlink
export type CyberlinksResponse = [number, CyberlinkState][]; // Multiple cyberlinks
export type NamedCyberlinksResponse = [string, number][]; // Named cyberlinks
export type CyberlinksByIdsResponse = [number, CyberlinkState][]; // Cyberlinks by IDs
export type CyberlinksByOwnerResponse = [number, CyberlinkState][]; // Owner's cyberlinks
export type CyberlinksByOwnerTimeResponse = [number, CyberlinkState][]; // Time-filtered cyberlinks
export type CyberlinksByOwnerTimeAnyResponse = [number, CyberlinkState][]; // Time-filtered (any) cyberlinks
export type CyberlinkByFormattedIdResponse = CyberlinkState; // Single cyberlink by formatted ID
