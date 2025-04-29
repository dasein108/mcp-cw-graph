#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import 'dotenv/config';
import { z } from 'zod';
import { CyberlinkMessageService } from './services/cyberlink/message.service';
import { CyberlinkQueryService } from './services/cyberlink/query.service';
import { CyberlinkTxService } from './services/cyberlink/tx.service';
import { EmbeddingService, type ProgressState } from './services/embedding.service';
import { parseToNanos } from './utils';
import { executeOrJustMsg, formatMsgResponse } from './utils/response.utils';
/**
 * Register all query-related tools
 */
function registerQueryTools(server: McpServer, cyberlinkQueryService: CyberlinkQueryService) {
  server.tool(
    'query_transaction',
    'Query the status and result of a transaction by its hash.',
    {
      transaction_hash: z.string().describe('Hash of the transaction to query'),
    },
    async (args) =>
      formatMsgResponse(await cyberlinkQueryService.waitForTransaction(args.transaction_hash))
  );

  server.tool(
    'query_by_gid',
    'Retrieves complete information about a specific cyberlink using its global identifier.',
    {
      gid: z.string().describe('GID of the cyberlink'),
    },
    async (args) => formatMsgResponse(await cyberlinkQueryService.queryById(args.gid))
  );

  server.tool(
    'query_by_fid',
    'Retrieves complete information about a specific cyberlink using its human-readable fid.',
    {
      fid: z.string().describe('FID of the cyberlink'),
    },
    async (args) => formatMsgResponse(await cyberlinkQueryService.queryByFormattedId(args.fid))
  );

  server.tool(
    'query_cyberlinks',
    'Queries multiple cyberlinks with pagination support and optional owner filtering, returning sorted results.',
    {
      start_after: z.number().optional().describe('Start cursor for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
      owner: z.string().optional().describe('Owner address to filter by'),
    },
    async (args) => {
      const result = args.owner
        ? await cyberlinkQueryService.queryByOwner(args.owner, args.start_after, args.limit)
        : await cyberlinkQueryService.queryCyberlinks(args.start_after, args.limit);
      return formatMsgResponse(result);
    }
  );

  server.tool(
    'query_cyberlinks_by_type',
    'Returns cyberlinks of a specific type with pagination support.',
    {
      type: z.string().describe('Type to filter by'),
      start_after_gid: z.number().optional().describe('GID to start after for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryCyberlinksByType(
          args.type,
          args.start_after_gid,
          args.limit
        )
      )
  );

  server.tool(
    'query_cyberlinks_by_from',
    'Returns cyberlinks originating from a specific node.',
    {
      from: z.string().describe("Source node's fid"),
      start_after_gid: z.number().optional().describe('GID to start after for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryCyberlinksByFrom(
          args.from,
          args.start_after_gid,
          args.limit
        )
      )
  );

  server.tool(
    'query_cyberlinks_by_to',
    'Returns cyberlinks pointing to a specific node.',
    {
      to: z.string().describe("Target node's fid"),
      start_after_gid: z.number().optional().describe('GID to start after for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryCyberlinksByTo(args.to, args.start_after_gid, args.limit)
      )
  );

  server.tool(
    'query_cyberlinks_by_owner_time',
    'Returns cyberlinks created by an owner within a time range.',
    {
      owner: z.string().describe("Owner's address"),
      start_time: z.string().describe('Start of time range (ISO 8601 datetime)'),
      end_time: z.string().optional().describe('End of time range (ISO 8601 datetime)'),
      start_after_gid: z.number().optional().describe('GID to start after for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryCyberlinksByOwnerTime(
          args.owner,
          parseToNanos(args.start_time),
          args.end_time ? parseToNanos(args.end_time) : undefined,
          args.start_after_gid,
          args.limit
        )
      )
  );

  server.tool(
    'query_cyberlinks_by_owner_time_any',
    'Returns cyberlinks created or updated by an owner within a time range.',
    {
      owner: z.string().describe("Owner's address"),
      start_time: z.string().describe('Start of time range (ISO 8601 datetime)'),
      end_time: z.string().optional().describe('End of time range (ISO 8601 datetime)'),
      start_after_gid: z.number().optional().describe('GID to start after for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryCyberlinksByOwnerTimeAny(
          args.owner,
          parseToNanos(args.start_time),
          args.end_time ? parseToNanos(args.end_time) : undefined,
          args.start_after_gid,
          args.limit
        )
      )
  );

  server.tool(
    'get_graph_stats',
    'Retrieves statistics about cyberlinks in the graph.',
    {
      owner: z.string().optional().describe('Address to get stats for'),
      type: z.string().optional().describe('Type to get stats for'),
    },
    async (args) =>
      formatMsgResponse(await cyberlinkQueryService.getGraphStats(args.owner, args.type))
  );

  // --- MISSING QUERY TOOLS ---
  server.tool(
    'query_named_cyberlinks',
    'Query all named cyberlinks with pagination.',
    {
      start_after: z.string().optional().describe('Start after this name for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryNamedCyberlinks(args.start_after, args.limit)
      )
  );

  server.tool(
    'query_by_gids',
    'Query multiple cyberlinks by their numeric IDs.',
    {
      gids: z.array(z.string()).describe('Array of global IDs'),
    },
    async (args) => formatMsgResponse(await cyberlinkQueryService.queryByIds(args.gids))
  );

  server.tool(
    'query_by_owner',
    'Query cyberlinks by owner address with pagination.',
    {
      owner: z.string().describe("Owner's address"),
      start_after: z.number().optional().describe('Start cursor for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryByOwner(args.owner, args.start_after, args.limit)
      )
  );

  server.tool(
    'query_by_time_range',
    'Query cyberlinks by creation time range.',
    {
      owner: z.string().describe("Owner's address"),
      start_time: z.string().describe('Start of time range (ISO 8601 datetime)'),
      end_time: z.string().optional().describe('End of time range (ISO 8601 datetime)'),
      start_after: z.number().optional().describe('Start cursor for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryByTimeRange(
          args.owner,
          parseToNanos(args.start_time),
          args.end_time ? parseToNanos(args.end_time) : undefined,
          args.start_after,
          args.limit
        )
      )
  );

  server.tool(
    'query_by_time_range_any',
    'Query cyberlinks by creation or update time range.',
    {
      owner: z.string().describe("Owner's address"),
      start_time: z.string().describe('Start of time range (ISO 8601 datetime)'),
      end_time: z.string().optional().describe('End of time range (ISO 8601 datetime)'),
      start_after: z.number().optional().describe('Start cursor for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryByTimeRangeAny(
          args.owner,
          parseToNanos(args.start_time),
          args.end_time ? parseToNanos(args.end_time) : undefined,
          args.start_after,
          args.limit
        )
      )
  );

  server.tool(
    'query_cyberlinks_by_owner_and_type',
    'Returns cyberlinks of a specific type owned by an address.',
    {
      owner: z.string().describe("Owner's address"),
      type: z.string().describe('Type to filter by'),
      start_after_gid: z.number().optional().describe('GID to start after for pagination'),
      limit: z.number().default(50).describe('Maximum number of results to return'),
    },
    async (args) =>
      formatMsgResponse(
        await cyberlinkQueryService.queryCyberlinksByOwnerAndType(
          args.owner,
          args.type,
          args.start_after_gid,
          args.limit
        )
      )
  );

  server.tool('query_last_id', 'Get the last assigned cyberlink GID.', {}, async () =>
    formatMsgResponse(await cyberlinkQueryService.queryLastId())
  );

  server.tool('query_config', 'Query contract configuration.', {}, async () =>
    formatMsgResponse(await cyberlinkQueryService.queryConfig())
  );

  server.tool('query_debug_state', 'Query contract debug state (admin only).', {}, async () =>
    formatMsgResponse(await cyberlinkQueryService.queryDebugState())
  );

  server.tool(
    'get_tx_status',
    'Check transaction status and get cyberlink IDs.',
    {
      transaction_hash: z.string().describe('Transaction hash to check'),
    },
    async (args) =>
      formatMsgResponse(await cyberlinkQueryService.getTxStatus(args.transaction_hash))
  );
}

/**
 * Register all transaction and other tools
 */
function registerTransactionTools(
  server: McpServer,
  cyberlinkMessageService: CyberlinkMessageService,
  embeddingService: EmbeddingService,
  cyberlinkTxService?: CyberlinkTxService
) {
  server.tool(
    'create_cyberlink',
    'Creates a new cyberlink with an auto-generated fid. Only type is required, from/to are optional and can be omitted together.',
    {
      type: z.string().describe('Type of the cyberlink'),
      from: z.string().optional().describe('Source of the cyberlink (fid) - optional'),
      to: z.string().optional().describe('Target of the cyberlink (fid) - optional'),
      value: z.string().optional().describe('Value for the cyberlink - optional'),
    },
    async (args) =>
      executeOrJustMsg(cyberlinkMessageService.createCyberlinkMsg(args), cyberlinkTxService)
  );

  server.tool(
    'create_cyberlink2',
    'Creates a node and links it to an existing node in a single transaction.',
    {
      node_type: z.string().describe('Type of the new node to create'),
      node_value: z.string().optional().describe('Value/content of the new node'),
      link_type: z.string().describe('Type of the link between nodes'),
      link_value: z.string().optional().describe('Value/metadata for the link'),
      link_to_existing_id: z.string().optional().describe('GID of existing node to link to'),
      link_from_existing_id: z.string().optional().describe('GID of existing node to link from'),
    },
    async (args) =>
      executeOrJustMsg(cyberlinkMessageService.createCyberlink2Msg(args), cyberlinkTxService)
  );

  server.tool(
    'create_named_cyberlink',
    'Creates a cyberlink with a custom string identifier. Admin-only operation.',
    {
      name: z.string().describe('Name of the cyberlink'),
      cyberlink: z.object({
        type: z.string().describe('Type of the cyberlink'),
        from: z.string().optional().describe('Source of the cyberlink (fid)'),
        to: z.string().optional().describe('Target of the cyberlink (fid)'),
        value: z.string().optional().describe('Value for the cyberlink'),
      }),
    },
    async (args) =>
      executeOrJustMsg(
        cyberlinkMessageService.createNamedCyberlinkMsg(args.name, args.cyberlink),
        cyberlinkTxService
      )
  );

  server.tool(
    'create_cyberlinks',
    'Creates multiple cyberlinks in a single atomic transaction, ensuring all succeed or all fail.',
    {
      cyberlinks: z.array(
        z.object({
          type: z.string().describe('Type of the cyberlink'),
          from: z.string().optional().describe('Source of the cyberlink (fid)'),
          to: z.string().optional().describe('Target of the cyberlink (fid)'),
          value: z.string().optional().describe('Value for the cyberlink'),
        })
      ),
    },
    async (args) =>
      executeOrJustMsg(
        cyberlinkMessageService.createCyberlinksMsg(args.cyberlinks),
        cyberlinkTxService
      )
  );

  server.tool(
    'update_cyberlink',
    'Updates an existing cyberlink, allowing only the value field to be modified while preserving the relationship structure.',
    {
      gid: z.number().describe('GID of the cyberlink to update'),
      cyberlink: z.object({
        type: z.string().describe('Type of the cyberlink'),
        from: z.string().optional().describe('Source of the cyberlink'),
        to: z.string().optional().describe('Target of the cyberlink'),
        value: z.string().optional().describe('Value for the cyberlink'),
      }),
    },
    async (args) =>
      executeOrJustMsg(
        cyberlinkMessageService.updateCyberlinkMsg(args.gid, args.cyberlink),
        cyberlinkTxService
      )
  );

  server.tool(
    'delete_cyberlink',
    'Permanently removes a cyberlink from the social graph, requiring owner or admin permissions.',
    {
      gid: z.number().describe('GID of the cyberlink to delete'),
    },
    async (args) =>
      executeOrJustMsg(cyberlinkMessageService.deleteCyberlinkMsg(args.gid), cyberlinkTxService)
  );

  if (cyberlinkTxService) {
    server.tool(
      'query_wallet_balance',
      'Return the wallet address and all token balances',
      {},
      async () => formatMsgResponse(await cyberlinkTxService.queryWalletBalance())
    );

    server.tool(
      'send_tokens',
      'Send tokens from your wallet to another address',
      {
        recipient: z.string().describe('Recipient wallet address'),
        amount: z.string().describe("Amount of tokens to send (e.g. '100000')"),
        denom: z.string().default('stake').describe("Token denomination (e.g. 'stake')"),
      },
      async (args) =>
        executeOrJustMsg(
          { send_tokens: { recipient: args.recipient, amount: args.amount, denom: args.denom } },
          cyberlinkTxService
        )
    );
  }

  server.tool(
    'update_with_embedding',
    'Enhances a cyberlink by generating and adding a semantic embedding to its content for similarity-based operations.',
    {
      formatted_id: z.string().describe('Fid of the cyberlink to update'),
    },
    async (args) => formatMsgResponse(await embeddingService.updateWithEmbedding(args.formatted_id))
  );
}

async function main() {
  try {
    // Get environment variables directly
    const nodeUrl = process.env.NODE_URL;
    const walletMnemonic = process.env.WALLET_MNEMONIC;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const denom = process.env.DENOM || 'stake';

    const isTxServiceEnabled = walletMnemonic !== undefined;

    // Initialize MCP Server with high-level abstraction
    const server = new McpServer(
      { name: 'cyberlink-mcp', version: '0.2.2' },
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

    // Initialize CyberlinkTxService if walletMnemonic is provided
    // Otherwise, tool prepare messages for external execution
    const cyberlinkTxService = isTxServiceEnabled
      ? new CyberlinkTxService(nodeUrl!, walletMnemonic, contractAddress!, denom)
      : undefined;

    const cyberlinkMessageService = new CyberlinkMessageService();
    const cyberlinkQueryService = new CyberlinkQueryService(nodeUrl!, contractAddress!);

    const embeddingService = new EmbeddingService((state: ProgressState) =>
      server.server.sendLoggingMessage({
        level: 'info',
        data: `${state.status}: ${state.message}`,
      })
    );

    // Register all tools
    registerQueryTools(server, cyberlinkQueryService);
    registerTransactionTools(server, cyberlinkMessageService, embeddingService, cyberlinkTxService);

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    cyberlinkTxService && (await cyberlinkTxService.initialize());
    await cyberlinkQueryService.initialize();
    await embeddingService.initialize();

    console.error(
      isTxServiceEnabled
        ? 'Cyberlink MCP Server running'
        : 'Cyberlink MCP Server running (no tx service)'
    );
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
