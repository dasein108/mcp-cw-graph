#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { CyberlinkService } from './cyberlink-service';

/**
 * Format transaction result for response
 * @param result Transaction result from CyberlinkService
 * @returns Formatted response object
 */
function formatTransactionResponse(result: any) {
  if (result?.status === 'failed') {
    return {
      content: [
        {
          type: 'text',
          text: `Operation failed: ${result?.error || 'Unknown error'}`
        },
        {
          type: 'text',
          text: JSON.stringify(result)
        }
      ]
    };
  }

  const txHash = result?.transactionHash || '';
  const numericId = result?.result?.numeric_id;
  const formattedId = result?.result?.formatted_id;

  const responseContent = [
    {
      type: 'text',
      text: `Operation completed successfully.`
    }
  ];

  if (txHash) {
    responseContent.push({
      type: 'text',
      text: `Transaction hash: ${txHash}`
    });
  }

  if (numericId) {
    responseContent.push({
      type: 'text',
      text: `Numeric ID: ${numericId}`
    });
  }

  if (formattedId) {
    responseContent.push({
      type: 'text',
      text: `Formatted ID: ${formattedId}`
    });
  }

  responseContent.push({
    type: 'text',
    text: JSON.stringify(result)
  });

  return { content: responseContent };
}



async function main() {
  try {
    // Get environment variables directly
    const nodeUrl = process.env.NODE_URL;
    const walletMnemonic = process.env.WALLET_MNEMONIC;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const denom = process.env.DENOM || 'stake';

    // Initialize CyberlinkService
    const cyberlinkService = new CyberlinkService(nodeUrl!, walletMnemonic!, contractAddress!, denom);
    await cyberlinkService.initialize();

    // Initialize MCP Server
    const server = new Server(
      { name: 'cyberlink-mcp', version: '0.1.0' },
      { 
        capabilities: { 
          tools: {},
          logging: {
            notifications: true,
            messages: true
          }
        } 
      }
    );

    // Tool Definitions
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // CRUD operations
        {
          name: 'create_cyberlink',
          description: 'Create a new cyberlink and wait for confirmation. Returns transaction details including numeric_id and formatted_id.',
          inputSchema: {
            type: "object",
            properties: {
              type: { type: "string", description: "Type of the cyberlink" },
              from: { type: "string", description: "Source of the cyberlink(formatted_id)" },
              to: { type: "string", description: "Target of the cyberlink(formatted_id)" },
              value: { type: "string", description: "Value for the cyberlink" }
            },
            required: ["type"]
          }
        },
        {
          name: 'create_named_cyberlink',
          description: 'Create a named cyberlink and wait for confirmation. Returns transaction details including numeric_id and formatted_id.',
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the cyberlink" },
              cyberlink: {
                type: "object",
                properties: {
                  type: { type: "string", description: "Type of the cyberlink" },
                  from: { type: "string", description: "Source of the cyberlink" },
                  to: { type: "string", description: "Target of the cyberlink" },
                  value: { type: "string", description: "Value for the cyberlink" }
                },
                required: ["type"]
              }
            },
            required: ["name", "cyberlink"]
          }
        },
        {
          name: 'create_cyberlinks',
          description: 'Create multiple cyberlinks in batch and wait for confirmation. Returns transaction details including numeric_id and formatted_id.',
          inputSchema: {
            type: "object",
            properties: {
              cyberlinks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", description: "Type of the cyberlink" },
                    from: { type: "string", description: "Source of the cyberlink" },
                    to: { type: "string", description: "Target of the cyberlink" },
                    value: { type: "string", description: "Value for the cyberlink" }
                  },
                  required: ["type"]
                }
              }
            },
            required: ["cyberlinks"]
          }
        },
        {
          name: 'update_cyberlink',
          description: 'Update an existing cyberlink and wait for confirmation. Returns transaction details including numeric_id and formatted_id.',
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "number", description: "ID of the cyberlink to update" },
              cyberlink: {
                type: "object",
                properties: {
                  type: { type: "string", description: "Type of the cyberlink" },
                  from: { type: "string", description: "Source of the cyberlink" },
                  to: { type: "string", description: "Target of the cyberlink" },
                  value: { type: "string", description: "Value for the cyberlink" }
                },
                required: ["type"]
              }
            },
            required: ["id", "cyberlink"]
          }
        },
        {
          name: 'delete_cyberlink',
          description: 'Delete a cyberlink and wait for confirmation. Returns transaction details.',
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "number", description: "ID of the cyberlink to delete" }
            },
            required: ["id"]
          }
        },
        
        // QUERY OPERATIONS
        
        // 1. Query by ID (numeric)
        {
          name: 'query_by_id',
          description: 'Query a cyberlink by its numeric ID',
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "number", description: "Numeric ID of the cyberlink" }
            },
            required: ["id"]
          }
        },
        
        // 2. Query by formatted ID (string)
        {
          name: 'query_by_formatted_id',
          description: 'Query a cyberlink by its formatted string ID',
          inputSchema: {
            type: "object",
            properties: {
              formatted_id: { type: "string", description: "Formatted string ID of the cyberlink" }
            },
            required: ["formatted_id"]
          }
        },
        
        // 3. Query all cyberlinks (paginated)
        {
          name: 'query_cyberlinks',
          description: 'Query all cyberlinks with pagination',
          inputSchema: {
            type: "object",
            properties: {
              start_after: { 
                type: "number", 
                description: "Start cursor for pagination" 
              },
              limit: { 
                type: "number", 
                description: "Maximum number of results to return",
                default: 50 
              }
            }
          }
        },
        
        // 4. Query by owner
        {
          name: 'query_by_owner',
          description: 'Query cyberlinks by owner address',
          inputSchema: {
            type: "object",
            properties: {
              owner: { 
                type: "string", 
                description: "Owner address to filter by" 
              },
              start_after: { 
                type: "number", 
                description: "Start cursor for pagination" 
              },
              limit: { 
                type: "number", 
                description: "Maximum number of results to return",
                default: 50 
              }
            },
            required: ["owner"]
          }
        },
        
        // 5. Query by time range (creation time)
        {
          name: 'query_by_time_range',
          description: 'Query cyberlinks by creation time range',
          inputSchema: {
            type: "object",
            properties: {
              owner: { 
                type: "string", 
                description: "Owner address to filter by" 
              },
              start_time: { 
                type: ["number", "string"], 
                description: "Start time for time range query (nanosecond timestamp)" 
              },
              end_time: { 
                type: ["number", "string"], 
                description: "End time for time range query (nanosecond timestamp)" 
              },
              start_after: { 
                type: ["number", "string"], 
                description: "Start cursor for pagination" 
              },
              limit: { 
                type: "number", 
                description: "Maximum number of results to return",
                default: 50 
              }
            },
            required: ["owner", "start_time"]
          }
        },
        
        // 6. Query by time range (creation or update time)
        {
          name: 'query_by_time_range_any',
          description: 'Query cyberlinks by creation or update time range',
          inputSchema: {
            type: "object",
            properties: {
              owner: { 
                type: "string", 
                description: "Owner address to filter by" 
              },
              start_time: { 
                type: ["number", "string"], 
                description: "Start time for time range query (nanosecond timestamp)" 
              },
              end_time: { 
                type: ["number", "string"], 
                description: "End time for time range query (nanosecond timestamp)" 
              },
              start_after: { 
                type: ["number", "string"], 
                description: "Start cursor for pagination" 
              },
              limit: { 
                type: "number", 
                description: "Maximum number of results to return",
                default: 50 
              }
            },
            required: ["owner", "start_time"]
          }
        },
        
        // 7. Query named cyberlinks
        {
          name: 'query_named_cyberlinks',
          description: 'Query all named cyberlinks with pagination',
          inputSchema: {
            type: "object",
            properties: {
              start_after: { 
                type: "number", 
                description: "Start cursor for pagination" 
              },
              limit: { 
                type: "number", 
                description: "Maximum number of results to return",
                default: 50 
              }
            }
          }
        },
        
        // 8. Query multiple cyberlinks by IDs
        {
          name: 'query_by_ids',
          description: 'Query multiple cyberlinks by their numeric IDs',
          inputSchema: {
            type: "object",
            properties: {
              ids: { 
                type: "array",
                items: { type: "number" },
                description: "Array of cyberlink IDs to query" 
              }
            },
            required: ["ids"]
          }
        },
        
        // 9. Query last ID
        {
          name: 'query_last_id',
          description: 'Query the last assigned cyberlink ID',
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        
        // 10. Query contract configuration
        {
          name: 'query_config',
          description: 'Query contract configuration and settings',
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        
        // 11. Query debug state
        {
          name: 'query_debug_state',
          description: 'Query contract debug state (admin only)',
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // 12. Query wallet balance
        {
          name: 'query_wallet_balance',
          description: 'Return the wallet address and all token balances',
          inputSchema: {
            type: "object",
            properties: {}
          }
        },

        // 13. Send tokens
        {
          name: 'send_tokens',
          description: 'Send tokens from your wallet to another address',
          inputSchema: {
            type: "object",
            properties: {
              recipient: {
                type: "string",
                description: "Recipient wallet address"
              },
              amount: {
                type: "string",
                description: "Amount of tokens to send (e.g. '100000')"
              },
              denom: {
                type: "string",
                description: `Token denomination (e.g. '${denom}')`,
                default: denom
              }
            },
            required: ["recipient", "amount"]
          }
        },
      ]
    }));

    // Tool Handlers
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Handler for query operations
        const handleQueryOperation = async (operationName: string, args: any) => {
          let result;
          
          switch (operationName) {
            // Query by ID (numeric)
            case 'query_by_id':
              result = await cyberlinkService.queryById(args.id);
              break;
              
            // Query by formatted ID (string)
            case 'query_by_formatted_id':
              result = await cyberlinkService.queryByFormattedId(args.formatted_id);
              break;
              
            // Query all cyberlinks (paginated)
            case 'query_cyberlinks':
              server.sendLoggingMessage({
                level: "info",
                data: "Querying all cyberlinks",
              });
              result = await cyberlinkService.queryCyberlinks(args.start_after, args.limit || 50);

              break;
              
            // Query by owner
            case 'query_by_owner':
              result = await cyberlinkService.queryByOwner(args.owner, args.start_after, args.limit || 50);
              break;
              
            // Query by time range (creation time)
            case 'query_by_time_range':
              result = await cyberlinkService.queryByTimeRangeAny(
                args.owner,
                args.start_time,
                args.end_time,
                args.start_after,
                args.limit || 50
              );
              break;
              
            // Query by time range (creation or update time)
            case 'query_by_time_range_any':
              result = await cyberlinkService.queryByTimeRangeAny(
                args.owner,
                args.start_time,
                args.end_time,
                args.start_after,
                args.limit || 50
              );
              break;
              
            // Query named cyberlinks
            case 'query_named_cyberlinks':
              result = await cyberlinkService.queryNamedCyberlinks(args.start_after, args.limit || 50);
              break;
              
            // Query multiple cyberlinks by IDs
            case 'query_by_ids':
              result = await cyberlinkService.queryByIds(args.ids);
              break;
              
            // Query last ID
            case 'query_last_id':
              result = await cyberlinkService.queryLastId();
              break;
              
            // Query contract configuration
            case 'query_config':
              result = await cyberlinkService.queryConfig();
              break;
              
            // Query debug state
            case 'query_debug_state':
              result = await cyberlinkService.queryDebugState();
              break;
              
            case 'query_wallet_balance':
              result = await cyberlinkService.queryWalletBalance();
              break;
              
            default:
              throw new McpError(ErrorCode.MethodNotFound, `Unknown query operation: ${operationName}`);
          }
          
          return { 
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        };
        
        // Handler for CRUD operations
        const handleCrudOperation = async (operationName: string, args: any) => {
          let result;
          
          // server.sendLoggingMessage({
          //   level: "info",
          //   data: `Executing ${operationName} with args: ${JSON.stringify(args)}`,
          // });
          
          switch (operationName) {
            case 'create_cyberlink':
              result = await cyberlinkService.createCyberlink(args);
              break;
            case 'create_named_cyberlink':
              result = await cyberlinkService.createNamedCyberlink(args.name, args.cyberlink);
              break;
            case 'create_cyberlinks':
              result = await cyberlinkService.createCyberlinks(args.cyberlinks);
              break;
            case 'update_cyberlink':
              result = await cyberlinkService.updateCyberlink(args.id, args.cyberlink);
              break;
            case 'delete_cyberlink':
              result = await cyberlinkService.deleteCyberlink(args.id);
              break;

            case 'send_tokens':
              result = await cyberlinkService.sendTokens(args.recipient, args.amount, args.denom);
              break;
            default:
              throw new McpError(ErrorCode.MethodNotFound, `Unknown CRUD operation: ${operationName}`);
          }
          
          return formatTransactionResponse(result);
        };
        
        // Determine the type of operation and use the appropriate handler
        const isQueryOperation = name.startsWith('query_');
        
        if (isQueryOperation) {
          return await handleQueryOperation(name, args);
        } else {
          return await handleCrudOperation(name, args);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Operation failed', { error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Start Server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Cyberlink MCP Server running');
  } catch (err) {
    console.error('Server failed:', err);
    process.exit(1);
  }
}

main();
