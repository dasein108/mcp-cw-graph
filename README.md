# Cyberlink MCP Server

A Model Context Protocol (MCP) server for interacting with the CW-Social smart contract on Cosmos-based blockchains. This server provides a standardized interface for creating, updating, and querying cyberlinks - semantic relationships between entities on the blockchain.

## Features

- **Core Operations**
  - Create, read, update, and delete cyberlinks
  - Support for named cyberlinks with custom identifiers
  - Batch operations for efficient processing
  - Rich query capabilities with filtering and pagination
- **Transaction Management**

  - Real-time transaction monitoring and status polling
  - Detailed transaction results and error handling
  - Support for both internal and external transaction signing
  - Token transfer capabilities

- **Advanced Features**
  - Semantic embedding generation via Hugging Face transformers
  - Real-time progress tracking for model operations
  - Cosine similarity calculations for semantic matching
  - Flexible ID system with formatted IDs (fids) and global IDs (gids)
  - Time-range based queries with UTC support
  - Owner-based filtering and statistics

## Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Access to a running Cosmos blockchain node
- Wallet with sufficient funds for transactions
- [Cursor IDE](https://cursor.sh/) for development
- [Claude Desktop](https://claude.ai/desktop) for AI assistance

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

4. Configure environment variables (see Configuration section)

## Configuration

### MCP Server Setup

Create or modify the configuration file at `~/.cursor/mcp.json`:

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
        "DENOM": "stake",
        "PREFIX": "cyber"
      }
    }
  }
}
```

### Required Configuration

Required environment variables:

- `PATH_TO_YOUR_PROJECT`: Absolute path to project directory
- `NODE_URL`: Cosmos blockchain node URL
- `CONTRACT_ADDRESS`: Deployed smart contract address

### Optional Configuration

Optional environment variables:

- `WALLET_MNEMONIC`: Wallet mnemonic for signing (default: none - transactions will be unsigned)
- `DENOM`: Token denomination (default: "stake")
- `PREFIX`: BECH32 prefix

## Available Tools

### Cyberlink Management

#### Creation Tools

**create_cyberlink**

- Description: Create single cyberlink
- Required: `type`
- Optional: `from`, `to`, `value`

**create_cyberlink2**

- Description: Create node + link
- Required: `node_type`, `link_type`
- Optional: `node_value`, `link_value`, `link_to_existing_id`, `link_from_existing_id`

**create_named_cyberlink**

- Description: Create named cyberlink (admin only)
- Required: `name`, `cyberlink`

**create_cyberlinks**

- Description: Batch create cyberlinks
- Required: `cyberlinks[]`

#### Modification Tools

**update_cyberlink**

- Description: Update existing cyberlink
- Required: `gid`, `cyberlink`

**delete_cyberlink**

- Description: Remove cyberlink
- Required: `gid`

**update_with_embedding**

- Description: Add semantic embedding
- Required: `formatted_id`

### Query Operations

#### Basic Queries

**query_by_gid**

- Description: Get by global ID
- Required: `gid`

**query_by_fid**

- Description: Get by formatted ID
- Required: `fid`

**query_cyberlinks**

- Description: List all with pagination
- Parameters: `limit`, `start_after`

**query_named_cyberlinks**

- Description: List named cyberlinks
- Parameters: `limit`, `start_after`

**query_by_gids**

- Description: Get multiple by IDs
- Required: `gids[]`

#### Filtered Queries

**query_cyberlinks_by_type**

- Description: Filter by type
- Required: `type`

**query_cyberlinks_by_from**

- Description: Filter by source
- Required: `from`

**query_cyberlinks_by_to**

- Description: Filter by target
- Required: `to`

**query_cyberlinks_by_owner_and_type**

- Description: Filter by owner & type
- Required: `owner`, `type`

#### Time-Based Queries

**query_cyberlinks_by_owner_time**

- Description: Filter by creation time
- Required: `owner`, `start_time`

**query_cyberlinks_by_owner_time_any**

- Description: Filter by any time
- Required: `owner`, `start_time`

### System Operations

#### Contract Info

**query_last_id**

- Description: Get last assigned ID

**query_config**

- Description: Get contract config

**query_debug_state**

- Description: Get debug state (admin only)

**get_graph_stats**

- Description: Get graph statistics

#### Transaction & Wallet

**query_transaction**

- Description: Get tx status
- Required: `transaction_hash`

**get_tx_status**

- Description: Get detailed tx status
- Required: `transaction_hash`

**query_wallet_balance**

- Description: Get wallet balances

**send_tokens**

- Description: Transfer tokens
- Required: `recipient`, `amount`

## Query Parameters

### Time Range Format

- All timestamps must be in ISO 8601 format
- Example: `2024-06-01T12:00:00Z`
- UTC timezone is assumed if not specified
- `start_time` is required, `end_time` is optional

### Pagination

- `start_after`: Pagination cursor
- `limit`: Results per page (default: 50)

## Development

### Build Commands

```bash
# Production build
npm run build

# Development mode
npm run dev
```

### Project Structure

```
src/
├── index.ts                # Entry point
├── cyberlink-service.ts    # Core service
├── services/
│   ├── embedding.service.ts  # Semantic analysis
│   └── __tests__/           # Test suite
└── types.ts                # Type definitions

cursor_rules/
└── chat_history.mdc       # Chat rules
```

### Error Codes

**InvalidParams**

- Description: Invalid parameters
- Common causes: Missing required fields, wrong format

**MethodNotFound**

- Description: Unknown tool
- Common causes: Typo in tool name, deprecated tool

**InternalError**

- Description: System error
- Common causes: Network issues, contract errors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
