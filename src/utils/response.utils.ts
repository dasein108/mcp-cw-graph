import { TxResponse } from '../services/cyberlink/types';

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
export function formatMsgResponse(result: any): McpResponse {
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
