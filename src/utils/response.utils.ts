import { CyberlinksResponse, CyberlinkState, TxResponse } from '../services/cyberlink/types';
import { nanosToISOString } from '../utils';

export interface McpResponse {
  [key: string]: unknown;
  content: {
    type: 'text';
    text: string;
    [key: string]: unknown;
  }[];
  _meta?: { [key: string]: unknown };
  isError?: boolean;
}

function formatCyberlinkStateTimestamps(obj: CyberlinkState): any {
  if (obj && typeof obj === 'object') {
    const newObj = { ...obj };
    // created_at
    newObj.created_at = nanosToISOString(newObj.created_at) || newObj.created_at;

    // updated_at
    if (typeof newObj.updated_at === 'string') {
      newObj.updated_at = nanosToISOString(newObj.updated_at) || newObj.updated_at;
    } else {
      newObj.updated_at = undefined;
    }
    return newObj;
  }
  return obj;
}

/**
 * Format transaction result for response
 * @param result Transaction result from CyberlinkService
 * @returns Formatted response object
 */
export function formatTxCyberlinkResponse(result: TxResponse): McpResponse {
  if (result?.status === 'failed') {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ status: 'failed', error: result?.error || 'Unknown error' }),
        },
      ],
    };
  }

  const resultContent = {
    status: 'completed',
    result: result?.result,
    info: result?.info,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(resultContent),
      },
    ],
  };
}

/**
 * Format message for response
 * @param result Any result to be formatted
 * @returns Formatted response object
 */
export function formatMsgResponse(result: object | CyberlinksResponse): McpResponse {
  if (Array.isArray(result)) {
    // flatten CyberlinkResponse and format timestamps
    const content = result.map((item) => {
      if (Array.isArray(item) && item.length === 2) {
        return { id: item[0], ...formatCyberlinkStateTimestamps(item[1]) };
      }
      return item;
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(content),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result),
      },
    ],
  };
}

/**
 * Execute transaction or just return message based on service availability
 * @param msg Message to be executed or returned
 * @param txService Optional transaction service
 * @returns Formatted response
 */
export async function executeOrJustMsg(
  msg: any,
  txService?: { executeTx: (msg: any) => Promise<TxResponse> }
): Promise<McpResponse> {
  if (txService) {
    return formatTxCyberlinkResponse(await txService.executeTx(msg));
  }
  return formatMsgResponse(msg);
}
