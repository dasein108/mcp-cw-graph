#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import 'dotenv/config';
import { z } from 'zod';
import { CyberlinkService } from './services/cyberlink.service';
import { EmbeddingService, type ProgressState } from './services/embedding.service';
import { CyberlinkValue, TxResponse } from './types';

/**
 * Turn string value into CyberlinkValue object
 * @param value CyberlinkValue or string
 * @returns CyberlinkValue
 */
function parseCyberlinkValue(value: string | CyberlinkValue): CyberlinkValue {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch (e) {
      // If parsing fails, treat as plain content
    }
    return { content: String(value) };
  }
  return value;
}

/**
 * Format transaction result for response
 * @param result Transaction result from CyberlinkService
 * @returns Formatted response object
 */
function formatTxCyberlinkResponse(result: TxResponse) {
  if (result?.status === 'failed') {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Operation failed: ${result?.error || 'Unknown error'}`,
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  const txHash = result?.transactionHash || '';
  const responseContent = [];

  // Add operation status
  responseContent.push({
    type: 'text' as const,
    text: `Operation completed successfully.`,
  });

  // Add transaction hash if available
  if (txHash) {
    responseContent.push({
      type: 'text' as const,
      text: `Transaction hash: ${txHash}`,
    });
  }

  // Add result details
  if (result?.result) {
    for (const key in result.result) {
      responseContent.push({
        type: 'text' as const,
        text: `${key}: ${result.result[key]}`,
      });
    }
  }

  // Add transaction info if available
  if (result?.info) {
    responseContent.push({
      type: 'text' as const,
      text: `Transaction info: ${JSON.stringify(result.info, null, 2)}`,
    });
  }

  return { content: responseContent };
}

async function main() {
  try {
    // Get environment variables directly
    const nodeUrl = process.env.NODE_URL;
    const walletMnemonic = process.env.WALLET_MNEMONIC;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const denom = process.env.DENOM || 'stake';

    // Initialize MCP Server with high-level abstraction
    const server = new McpServer(
      { name: 'cyberlink-mcp', version: '0.1.1' },
      {
        capabilities: {
          tools: {},
          logging: {
            notifications: true,
            messages: true,
          },
        },
      }
    );

    // Initialize services
    const cyberlinkService = new CyberlinkService(
      nodeUrl!,
      walletMnemonic!,
      contractAddress!,
      denom
    );

    const embeddingService = new EmbeddingService((state: ProgressState) =>
      // console.info(`${state.status}: ${state.message}`)
      server.server.sendLoggingMessage({
        level: 'info',
        data: `${state.status}: ${state.message}`,
      })
    );

    // CRUD Operations
    server.tool(
      'create_cyberlink',
      {
        type: z.string().describe('Type of the cyberlink'),
        from: z.string().optional().describe('Source of the cyberlink(formatted_id)'),
        to: z.string().optional().describe('Target of the cyberlink(formatted_id)'),
        value: z.string().optional().describe('Value for the cyberlink'),
      },
      async (args) => formatTxCyberlinkResponse(await cyberlinkService.createCyberlink(args))
    );

    server.tool(
      'create_named_cyberlink',
      {
        name: z.string().describe('Name of the cyberlink'),
        cyberlink: z.object({
          type: z.string().describe('Type of the cyberlink'),
          from: z.string().optional().describe('Source of the cyberlink(formatted_id)'),
          to: z.string().optional().describe('Target of the cyberlink(formatted_id)'),
          value: z.string().optional().describe('Value for the cyberlink'),
        }),
      },
      async (args) =>
        formatTxCyberlinkResponse(
          await cyberlinkService.createNamedCyberlink(args.name, args.cyberlink)
        )
    );

    server.tool(
      'create_cyberlinks',
      {
        cyberlinks: z.array(
          z.object({
            type: z.string().describe('Type of the cyberlink'),
            from: z.string().optional().describe('Source of the cyberlink(formatted_id)'),
            to: z.string().optional().describe('Target of the cyberlink(formatted_id)'),
            value: z.string().optional().describe('Value for the cyberlink'),
          })
        ),
      },
      async (args) =>
        formatTxCyberlinkResponse(await cyberlinkService.createCyberlinks(args.cyberlinks))
    );

    server.tool(
      'update_cyberlink',
      {
        id: z.number().describe('ID of the cyberlink to update'),
        cyberlink: z.object({
          type: z.string().describe('Type of the cyberlink'),
          from: z.string().optional().describe('Source of the cyberlink'),
          to: z.string().optional().describe('Target of the cyberlink'),
          value: z.string().optional().describe('Value for the cyberlink'),
        }),
      },
      async (args) =>
        formatTxCyberlinkResponse(await cyberlinkService.updateCyberlink(args.id, args.cyberlink))
    );

    server.tool(
      'delete_cyberlink',
      {
        id: z.number().describe('ID of the cyberlink to delete'),
      },
      async (args) => formatTxCyberlinkResponse(await cyberlinkService.deleteCyberlink(args.id))
    );

    // Query Operations
    server.tool(
      'query_by_id',
      {
        id: z.number().describe('Numeric ID of the cyberlink'),
      },
      async (args) => ({
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(await cyberlinkService.queryById(args.id)),
          },
        ],
      })
    );

    server.tool(
      'query_by_formatted_id',
      {
        formatted_id: z.string().describe('Formatted string ID of the cyberlink'),
      },
      async (args) => ({
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(await cyberlinkService.queryByFormattedId(args.formatted_id)),
          },
        ],
      })
    );

    server.tool(
      'query_cyberlinks',
      {
        start_after: z.number().optional().describe('Start cursor for pagination'),
        limit: z.number().default(50).describe('Maximum number of results to return'),
        owner: z.string().optional().describe('Owner address to filter by'),
      },
      async (args) => {
        const result = args.owner
          ? await cyberlinkService.queryByOwner(args.owner, args.start_after, args.limit)
          : await cyberlinkService.queryCyberlinks(args.start_after, args.limit);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      }
    );

    server.tool(
      'update_with_embedding',
      {
        formatted_id: z.string().describe('Formatted ID of the cyberlink to update'),
      },
      async (args) => {
        const cyberlink = await cyberlinkService.queryByFormattedId(args.formatted_id);
        if (!cyberlink) {
          throw new Error(`Cyberlink not found: ${args.formatted_id}`);
        }

        if (!cyberlink.value) {
          throw new Error('Cyberlink has no content to generate embedding for');
        }

        const valueObj = parseCyberlinkValue(cyberlink.value);
        const embedding = await embeddingService.generateEmbedding(valueObj.content!);
        const updatedValue = {
          ...valueObj,
          embedding: Array.from(embedding),
        };

        const result = await cyberlinkService.updateCyberlink(Number(cyberlink.id), {
          ...cyberlink,
          value: JSON.stringify(updatedValue),
        });

        return formatTxCyberlinkResponse(result);
      }
    );

    // Start Server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    await cyberlinkService.initialize();

    await embeddingService.initialize();

    console.error('Cyberlink MCP Server running');
  } catch (err) {
    console.error('Server failed:', err);
    process.exit(1);
  }
}

main();
