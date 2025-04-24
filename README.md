# Cyberlink MCP Server

A Model Context Protocol (MCP) server for interacting with the CW-Social smart contract on Cosmos-based blockchains. This server provides a standardized interface for creating, updating, and querying cyberlinks - semantic relationships between entities on the blockchain.

## Features

- Full CRUD operations for cyberlinks
- Named cyberlink support
- Batch operations
- Rich query capabilities
- Transaction status tracking
  - Real-time transaction monitoring
  - Automatic status polling
  - Detailed transaction results including cyberlink IDs
  - Support for both internal and external signing
- Input validation
- Error handling
- Integration with Cursor IDE and Claude Desktop
- Semantic embedding generation using Hugging Face transformers
- Real-time progress tracking for model loading
- Cosine similarity calculations for semantic comparisons
- Support for formatted IDs and numeric IDs
- Time-range based queries
- Owner-based filtering

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
        "CONTRACT_ADDRESS": "your contract address",
        "DENOM": "stake"
      }
    }
  }
}
```

Replace the following values:

- `PATH_TO_YOUR_PROJECT`: Absolute path to your cw-social-mcp project
- `NODE_URL`: Your Cosmos node URL
- `WALLET_MNEMONIC`: Your wallet's mnemonic phrase (optional - if not set, transactions will be returned unsigned for external signing)
- `CONTRACT_ADDRESS`: Your deployed contract address
- `DENOM`: (Optional) Token denomination, defaults to 'stake'

Note: When `WALLET_MNEMONIC` is set, the server will use its internal signer to sign and broadcast transactions. If not set, the server will return the pure transaction for external signing. This allows for flexible integration with different signing approaches and wallet management strategies.

The configuration uses stdio format for communication between the MCP server and the clients (Cursor/Claude Desktop).

## Verification

1. Restart Cursor IDE or Claude Desktop after configuration
2. The following tools should be available:

### Creation and Modification

- create_cyberlink - Create a new cyberlink
- create_named_cyberlink - Create a named cyberlink with identifier
- create_cyberlinks - Create multiple cyberlinks in batch
- update_cyberlink - Update an existing cyberlink by ID
- delete_cyberlink - Delete a cyberlink by ID
- update_with_embedding - Update cyberlink with semantic embedding

### Query Operations

- query_by_id - Query cyberlink by numeric ID
- query_by_formatted_id - Query cyberlink by formatted ID
- query_cyberlinks - Query all cyberlinks with pagination
- query_named_cyberlinks - Query all named cyberlinks
- query_by_ids - Query multiple cyberlinks by their IDs
- query_by_owner - Query cyberlinks by owner address
- query_by_time_range - Query cyberlinks by creation time
- query_by_time_range_any - Query cyberlinks by creation/update time
- query_last_id - Get last assigned cyberlink ID
- query_config - Query contract configuration
- query_debug_state - Query debug state (admin only)
- query_transaction - Query transaction status and results
  - Required parameters:
    - `transaction_hash`: Hash of the transaction to query
  - Returns:
    - Transaction status (confirmed/failed/pending)
    - For confirmed transactions:
      - Cyberlink IDs (numeric and formatted)
      - Transaction hash
    - For failed transactions:
      - Error message and code

### Wallet Operations

- query_wallet_balance - Get wallet address and balances

  - Returns the current wallet address and all token balances
  - No parameters required
  - Response includes:
    - `address`: The wallet's address
    - `balances`: Array of token balances with denomination and amount

- send_tokens - Send tokens to another address
  - Required parameters:
    - `recipient`: Target wallet address
    - `amount`: Amount of tokens to send (as string, e.g. '100000')
  - Optional parameters:
    - `denom`: Token denomination (defaults to the value from environment config)
  - Returns transaction details including hash and status

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
├── index.ts                # Main entry point
├── cyberlink-service.ts    # Cyberlink and blockchain operations
├── services/
│   ├── embedding.service.ts       # Semantic embedding generation
│   └── __tests__/                # Service test files
└── types.ts                # TypeScript types and schemas

cursor_rules/
└── chat_history.mdc       # Rules for chat history storage
```

## Services

### Embedding Service

The project includes a powerful embedding service that provides semantic analysis capabilities:

- Uses the `sentence-transformers/all-MiniLM-L6-v2` model from Hugging Face
- Generates normalized 384-dimensional embeddings for text
- Real-time progress tracking during model initialization
- Supports batch processing of text embeddings
- Calculates semantic similarities using cosine similarity
- Comprehensive error handling and progress reporting

Example progress states during model initialization:

1. Loading (0%) - Initial model loading
2. Downloading (0-50%) - Model file download progress
3. Loading (50-100%) - Loading model into memory
4. Ready (100%) - Model successfully loaded

## Cursor Rules

The project includes cursor rules that define behavior for specific features:

- **Chat History Storage**: Rules defining how chat history is stored and managed within the system. These rules ensure consistent handling of conversation data across the MCP server.

Copy rules into `./cursor/rules` directory

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
- `mcp_cw_graph_get_tx_status` - Check transaction status and get cyberlink IDs

### Wallet Operations

- `mcp_cw_graph_query_wallet_balance` - Get wallet address and token balances
- `mcp_cw_graph_send_tokens` - Send tokens to another wallet address

### Embedding Operations

- `mcp_cw_graph_update_with_embedding` - Generate and update cyberlink value with semantic embedding

## Query Parameters

### Time Range Queries

- `owner` - Owner address to filter by
- `start_time` - Start time in nanoseconds (Uint64, can be passed as string or number)
- `end_time` - Optional end time in nanoseconds (Uint64, can be passed as string or number)
- `start_after` - Optional pagination cursor (Uint64, can be passed as string or number)
- `limit` - Optional result limit (default: 50)

### Pagination

Most query endpoints support pagination with:

- `start_after` - Cursor for the next page (Uint64, can be passed as string or number)
- `limit` - Maximum number of results to return

### Data Types

- **Timestamps**: All timestamp fields use Uint64 format (nanoseconds since Unix epoch)
  - Can be passed as string to preserve precision for large values
  - Also accepts number format for backward compatibility
  - Example: "1683900000000000000" (string) or 1683900000000000000 (number)

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
