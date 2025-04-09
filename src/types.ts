// Core Types
export interface Cyberlink {
  type: string;
  from?: string;
  to?: string;
  value?: string;
}

export interface NamedCyberlink {
  id: number;
  name: string; // formatted_id or type
}

export interface CyberlinkState extends Cyberlink {
  id?: number;
  owner: string;
  created_at: string;
  updated_at?: string;
  formatted_id?: string;
}

// Response Types

// For CRUD operations
export interface TxResponse {
  transactionHash: string;
  status: 'completed' | 'pending' | 'failed';
  result?: Record<string, any>;
  error?: string;
}

// For tx status queries
export interface TxStatusResponse {
  status: 'pending' | 'confirmed' | 'failed';
  numeric_id?: string;
  formatted_id?: string;
  error?: string;
}

// For configuration queries
export interface ConfigResponse {
  admins: string[];
  executors: string[];
} 