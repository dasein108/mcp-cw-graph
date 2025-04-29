# Cyberlink MCP Server

A Model Context Protocol (MCP) server for interacting with the CW-Social smart contract on Cosmos-based blockchains. This server provides a standardized interface for creating, updating, and querying cyberlinks - semantic relationships between entities on the blockchain.

## Features

- **Core Operations**
  - Full CRUD operations for cyberlinks
  - Named cyberlink support
  - Batch operations
  - Rich query capabilities
- **Transaction Management**

  - Real-time transaction monitoring
  - Automatic status polling
  - Detailed transaction results
  - Support for both internal and external signing

- **Advanced Features**
  - Semantic embedding generation using Hugging Face transformers
  - Real-time progress tracking for model loading
  - Cosine similarity calculations
  - Support for fids (formatted IDs) and numeric IDs
  - Time-range based queries
  - Owner-based filtering

## Prerequisites

- Node.js 16+
- npm or yarn
- Access to a Cosmos blockchain node
- Wallet with funds for transactions
- [Cursor IDE](https://cursor.sh/)
- [Claude Desktop](https://claude.ai/desktop)

## Installation

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

## Configuration

### Setting up MCP Integration

Create or edit the configuration file at `~/.cursor/mcp.json`:

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

Required Configuration:

- `PATH_TO_YOUR_PROJECT`: Absolute path to your project
- `NODE_URL`: Your Cosmos node URL
- `CONTRACT_ADDRESS`: Your deployed contract address

Optional Configuration:

- `WALLET_MNEMONIC`: Your wallet's mnemonic phrase (if not set, transactions will be returned unsigned)
- `DENOM`: Token denomination (defaults to 'stake')

## Available Tools

### Cyberlink Management

#### Creation

- `create_cyberlink`: Create a new cyberlink

  - Required: `type`
  - Optional: `from`, `to`, `value`

- `create_cyberlink2`: Create a node and link it in one transaction

  - Required: `node_type`, `link_type`
  - Optional: `node_value`, `link_value`, `link_to_existing_id`, `link_from_existing_id`

- `create_named_cyberlink`: Create a named cyberlink (admin only)

  - Required: `name`, `cyberlink` object

- `create_cyberlinks`: Create multiple cyberlinks in batch
  - Required: `cyberlinks` array

#### Modification

- `update_cyberlink`: Update existing cyberlink

  - Required: `gid`, `cyberlink` object

- `delete_cyberlink`: Remove a cyberlink

  - Required: `gid`

- `update_with_embedding`: Add semantic embedding
  - Required: `formatted_id`

### Query Operations

#### Basic Queries

- `query_by_gid`: Get cyberlink by global ID
- `query_by_fid`: Get cyberlink by formatted ID
- `query_cyberlinks`: List all cyberlinks with pagination
- `query_named_cyberlinks`: List named cyberlinks
- `query_by_gids`: Get multiple cyberlinks by IDs

#### Filtered Queries

- `query_cyberlinks_by_type`: Filter by type
- `query_cyberlinks_by_from`: Filter by source node
- `query_cyberlinks_by_to`: Filter by target node
- `query_cyberlinks_by_owner_and_type`: Filter by owner and type

#### Time-Based Queries

- `query_cyberlinks_by_owner_time`: Filter by owner and creation time
- `query_cyberlinks_by_owner_time_any`: Filter by owner and creation/update time

#### System Queries

- `query_last_id`: Get last assigned cyberlink ID
- `query_config`: Get contract configuration
- `query_debug_state`: Get debug state (admin only)
- `get_graph_stats`: Get graph statistics

### Transaction & Wallet Operations

#### Transaction Management

- `query_transaction`: Get transaction status and result
- `get_tx_status`: Get detailed transaction status

#### Wallet Operations

- `query_wallet_balance`: Get wallet balances
- `send_tokens`: Transfer tokens

## Query Parameters

### Time Range Parameters

- `start_time`: ISO 8601 datetime (e.g., `2024-06-01T12:00:00Z`)
- `end_time`: Optional ISO 8601 datetime
- All times are treated as UTC if no timezone specified

### Pagination Parameters

- `start_after`: Pagination cursor (string/number)
- `limit`: Results per page (default: 50)

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Project Structure

```
src/
├── index.ts                # Entry point
├── cyberlink-service.ts    # Core operations
├── services/
│   ├── embedding.service.ts  # Semantic analysis
│   └── __tests__/           # Tests
└── types.ts                # Type definitions

cursor_rules/
└── chat_history.mdc       # Chat history rules
```

## Error Handling

Standard MCP error codes:

- `InvalidParams`: Invalid input
- `MethodNotFound`: Unknown tool
- `InternalError`: System error

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details.
