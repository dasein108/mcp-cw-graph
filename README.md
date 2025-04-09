# Cyberlink MCP Server

A Model Context Protocol (MCP) server for interacting with the CW-Social smart contract on Cosmos-based blockchains. This server provides a standardized interface for creating, updating, and querying cyberlinks - semantic relationships between entities on the blockchain.

## Features

- Full CRUD operations for cyberlinks
- Named cyberlink support
- Batch operations
- Rich query capabilities
- Transaction status tracking
- Input validation
- Error handling
- Integration with Cursor IDE and Claude Desktop

## Prerequisites

- Node.js 16+
- npm or yarn
- Access to a Cosmos blockchain node
- Wallet with funds for transactions
- [Cursor IDE](https://cursor.sh/) installed
- [Claude Desktop](https://claude.ai/desktop) installed

## Installation and Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/cw-social-mcp.git
cd cw-social-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Integration Configuration

Both Cursor IDE and Claude Desktop use the same MCP configuration format. Create or edit the configuration file:

- For Cursor: `~/.cursor/mcp.json`

Add the following configuration:

```json
{
    "mcpServers": {
        "cw-graph": {
        "command": "node",
        "args": ["PATH_TO_YOUR_PROJECT/dist/index.js"],
        "env": {
            "NODE_URL": "http://localhost:26657",
            "WALLET_MNEMONIC": "your wallet mnemonic phrase",
            "CONTRACT_ADDRESS": "your contract address"
            }
        }
    }
}
```

Replace the following values:
- `PATH_TO_YOUR_PROJECT`: Absolute path to your cw-social-mcp project
- `NODE_URL`: Your Cosmos node URL
- `WALLET_MNEMONIC`: Your wallet's mnemonic phrase
- `CONTRACT_ADDRESS`: Your deployed contract address

The configuration uses stdio format for communication between the MCP server and the clients (Cursor/Claude Desktop).

## Verification

1. Restart Cursor IDE or Claude Desktop after configuration
2. The following tools should be available:
   - create_cyberlink
   - create_named_cyberlink
   - create_cyberlinks
   - update_cyberlink
   - delete_cyberlink
   - query_cyberlinks
   - query_named_cyberlinks
   - query_cyberlinks_by_owner
   - query_config
   - get_tx_status

## Development

1. Build the project:
```bash
npm run build
```

2. Start the server in development mode:
```bash
npm run dev
```

## Project Structure

```
src/
├── index.ts             # Main entry point
├── cyberlink-service.ts # Cyberlink and blockchain operations
└── types.ts             # TypeScript types and schemas
```

## MCP Tools

### Creation and Modification
- `mcp_cw_graph_create_cyberlink` - Create a new cyberlink
- `mcp_cw_graph_create_named_cyberlink` - Create a named cyberlink with identifier
- `mcp_cw_graph_create_cyberlinks` - Create multiple cyberlinks in batch
- `mcp_cw_graph_update_cyberlink` - Update an existing cyberlink by ID
- `mcp_cw_graph_delete_cyberlink` - Delete a cyberlink by ID

### Basic Queries
- `mcp_cw_graph_query_by_id` - Query a single cyberlink by numeric ID
- `mcp_cw_graph_query_by_formatted_id` - Query a cyberlink by its formatted ID
- `mcp_cw_graph_query_cyberlinks` - Query all cyberlinks with pagination
- `mcp_cw_graph_query_named_cyberlinks` - Query all named cyberlinks
- `mcp_cw_graph_query_by_ids` - Query multiple cyberlinks by their IDs

### Advanced Queries
- `mcp_cw_graph_query_by_owner` - Query cyberlinks by owner address
- `mcp_cw_graph_query_by_time_range` - Query cyberlinks by creation time range
- `mcp_cw_graph_query_by_time_range_any` - Query cyberlinks by creation or update time range

### System Queries
- `mcp_cw_graph_query_last_id` - Get the last assigned cyberlink ID
- `mcp_cw_graph_query_config` - Query contract configuration
- `mcp_cw_graph_query_debug_state` - Query contract debug state (admin only)
- `mcp_cw_graph_get_tx_status` - Check transaction status and get cyberlink ID

## Query Parameters

### Time Range Queries
- `owner` - Owner address to filter by
- `start_time` - Start time in nanoseconds (string format)
- `end_time` - Optional end time in nanoseconds (string format)
- `start_after` - Optional pagination cursor
- `limit` - Optional result limit (default: 50)

### Pagination
Most query endpoints support pagination with:
- `start_after` - Cursor for the next page
- `limit` - Maximum number of results to return

## Error Handling

The server uses standardized error codes from the MCP protocol:
- `InvalidParams` - Invalid input parameters
- `MethodNotFound` - Unknown tool name
- `InternalError` - Blockchain or server errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 