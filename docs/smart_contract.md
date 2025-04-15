# CW-Social Smart Contract Documentation

## Overview
The CW-Social smart contract is a Cosmos SDK-based contract that implements a graph-based social network system. This documentation provides TypeScript examples using @cosmjs/cosmwasm-stargate for interacting with the contract.

## Contract Address
```typescript
const CONTRACT_ADDRESS = "wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d";
```

## Types

### Basic Types
```typescript
type Uint64 = string;
type Timestamp = string;
```

### Core Types
```typescript
interface Cyberlink {
  type: string;           // Required
  from?: string;          // Optional
  to?: string;           // Optional
  value?: string;        // Optional
}

interface NamedCyberlink {
  id: string;            // Required
  type: string;          // Required
  from?: string;         // Optional
  to?: string;          // Optional
  value?: string;        // Optional
}

interface CyberlinkState {
  type: string;
  from: string;
  to: string;
  value: string;
  owner: string;
  created_at: Timestamp;
  updated_at: Timestamp | null;
  formatted_id: string | null;
}

interface ConfigResponse {
  admins: string[];
  executors: string[];
}

interface StateResponse {
  cyberlinks: [number, CyberlinkState][];
  named_cyberlinks: [string, number][];
}
```

### Query Parameters
```typescript
interface CyberlinksParams {
  start_after?: number;
  limit?: number;
}

interface NamedCyberlinksParams {
  start_after?: string;
  limit?: number;
}

interface CyberlinksByOwnerParams {
  owner: string;
  start_after?: number;
  limit?: number;
}

interface CyberlinksByOwnerTimeParams {
  owner: string;
  start_time: Timestamp;
  end_time?: Timestamp;
  start_after?: number;
  limit?: number;
}
```

### Query Response Types
```typescript
type LastIdResponse = Uint64;
type DebugStateResponse = StateResponse;
type CyberlinkResponse = CyberlinkState;
type CyberlinksResponse = [number, CyberlinkState][];
type NamedCyberlinksResponse = [string, number][];
type CyberlinksByIdsResponse = [number, CyberlinkState][];
type CyberlinksByOwnerResponse = [number, CyberlinkState][];
type CyberlinksByOwnerTimeResponse = [number, CyberlinkState][];
type CyberlinksByOwnerTimeAnyResponse = [number, CyberlinkState][];
type CyberlinkByFormattedIdResponse = CyberlinkState;
```

### Query Message Types
```typescript
type QueryMsg =
  | { last_id: {} }
  | { debug_state: {} }
  | { cyberlink: { id: Uint64 } }
  | { config: {} }
  | { cyberlinks: CyberlinksParams }
  | { named_cyberlinks: NamedCyberlinksParams }
  | { cyberlinks_by_ids: { ids: number[] } }
  | { cyberlinks_by_owner: CyberlinksByOwnerParams }
  | { cyberlinks_by_owner_time: CyberlinksByOwnerTimeParams }
  | { cyberlinks_by_owner_time_any: CyberlinksByOwnerTimeParams }
  | { cyberlink_by_formatted_id: { formatted_id: string } };
```

## Cyberlink Restrictions and Rules

### Creation Rules
1. Only the `type` field is mandatory when creating a cyberlink
2. `from` and `to` are optional and can be omitted together
3. `value` is optional
4. If both `from` and `to` are provided:
   - They cannot be the same value
   - Both must reference existing entities in the contract
5. If `from` is provided, it must reference an existing entity
6. If `to` is provided, it must reference an existing entity
7. The `type` must be a valid type that exists in the contract

### Update Rules
1. Only the `value` field can be modified after creation
2. Cannot change the `type` field
3. Cannot change the `from` field
4. Cannot change the `to` field
5. Only the owner or an admin can update a cyberlink
6. Must be an executor to perform updates

### Named Cyberlink Rules
1. Names cannot contain colons (:)
2. Only admins can create named cyberlinks
3. Names must be unique in the contract
4. Once created, the name cannot be changed

### Default Values
1. If `from` is not provided, it defaults to "Any"
2. If `to` is not provided, it defaults to "Any"
3. If `value` is not provided, it defaults to empty string ("")

## Contract Messages

### InstantiateMsg
```typescript
interface InstantiateMsg {
  admins: string[];
  executers: string[];
  semantic_cores: string[];
}

// Example
const instantiateMsg: InstantiateMsg = {
  admins: ["wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s"],
  executers: ["wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s"],
  semantic_cores: ["Social", "Chat", "Lens"]
};
```

### Execute Messages

#### CreateNamedCyberlink
```typescript
interface CreateNamedCyberlinkMsg {
  create_named_cyberlink: {
    name: string;
    cyberlink: Cyberlink;
  };
}

// Example
const createNamedCyberlinkMsg: CreateNamedCyberlinkMsg = {
  create_named_cyberlink: {
    name: "user_profile",
    cyberlink: {
      type: "Profile",
      from: "user1",
      to: "user2",
      value: "friend"
    }
  }
};
```

#### CreateCyberlink
```typescript
interface CreateCyberlinkMsg {
  create_cyberlink: {
    cyberlink: Cyberlink;
  };
}

// Example of minimal cyberlink (only type required)
const createCyberlinkMsg: CreateCyberlinkMsg = {
  create_cyberlink: {
    cyberlink: {
      type: "Post"  // Only type is required
    }
  }
};

// Example of cyberlink with optional fields
const createCyberlinkMsg2: CreateCyberlinkMsg = {
  create_cyberlink: {
    cyberlink: {
      type: "Follow",
      from: "user1",     // Optional
      to: "user2",       // Optional
      value: "friend"    // Optional
    }
  }
};

#### CreateCyberlinks
```typescript
interface CreateCyberlinksMsg {
  create_cyberlinks: {
    cyberlinks: Cyberlink[];
  };
}

// Example of creating multiple cyberlinks
const createCyberlinksMsg: CreateCyberlinksMsg = {
  create_cyberlinks: {
    cyberlinks: [
      {
        type: "Follow",    // Minimal cyberlink with only type
      },
      {
        type: "Like",
        from: "user1",     // With optional fields
        to: "post1",
        value: "❤️"
      }
    ]
  }
};
```

#### UpdateCyberlink
```typescript
interface UpdateCyberlinkMsg {
  update_cyberlink: {
    id: number;
    cyberlink: Cyberlink;
  };
}

// Example of updating only the value (other fields must match original)
const updateCyberlinkMsg: UpdateCyberlinkMsg = {
  update_cyberlink: {
    id: 1,
    cyberlink: {
      type: "Follow",      // Must match original
      from: "user1",       // Must match original
      to: "user2",        // Must match original
      value: "best_friend" // Only this can be changed
    }
  }
};
```

#### DeleteCyberlink
```typescript
interface DeleteCyberlinkMsg {
  delete_cyberlink: {
    id: number;
  };
}

// Example
const deleteCyberlinkMsg: DeleteCyberlinkMsg = {
  delete_cyberlink: {
    id: 1
  }
};
```

#### UpdateAdmins
```typescript
interface UpdateAdminsMsg {
  update_admins: {
    new_admins: string[];
  };
}

// Example
const updateAdminsMsg: UpdateAdminsMsg = {
  update_admins: {
    new_admins: ["wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s", "wasm1..."]
  }
};
```

#### UpdateExecutors
```typescript
interface UpdateExecutorsMsg {
  update_executors: {
    new_executors: string[];
  };
}

// Example
const updateExecutorsMsg: UpdateExecutorsMsg = {
  update_executors: {
    new_executors: ["wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s", "wasm1..."]
  }
};
```

### Query Messages

Each query example below includes:
- The query message structure
- Example request
- Expected response type
- Example response

#### LastId
```typescript
// Query
interface LastIdQuery {
  last_id: Record<string, never>;
}

// Example request
const lastIdQuery: LastIdQuery = {
  last_id: {}
};

// Response type
type LastIdResponse = Uint64;

// Example response
"42" // string representation of Uint64
```

#### Cyberlink
```typescript
// Query
interface CyberlinkQuery {
  cyberlink: {
    id: number;
  };
}

// Example request
const cyberlinkQuery: CyberlinkQuery = {
  cyberlink: {
    id: 1
  }
};

// Response type
type CyberlinkResponse = CyberlinkState;

// Example response
{
  type: "Post",
  from: "user1",
  to: "Any",
  value: "Hello World!",
  owner: "wasm1...",
  created_at: "1683000000000000000",
  updated_at: null,
  formatted_id: "Post:1"
}
```

#### Config
```typescript
// Query
interface ConfigQuery {
  config: Record<string, never>;
}

// Example request
const configQuery: ConfigQuery = {
  config: {}
};

// Response type
interface ConfigResponse {
  admins: string[];
  executors: string[];
}

// Example response
{
  admins: ["wasm1..."],
  executors: ["wasm1...", "wasm2..."]
}
```

#### DebugState
```typescript
// Query
interface DebugStateQuery {
  debug_state: Record<string, never>;
}

// Example request
const debugStateQuery: DebugStateQuery = {
  debug_state: {}
};

// Response type
interface StateResponse {
  cyberlinks: [number, CyberlinkState][];
  named_cyberlinks: [string, number][];
}

// Example response
{
  cyberlinks: [
    [1, {
      type: "Post",
      from: "user1",
      to: "Any",
      value: "Hello World!",
      owner: "wasm1...",
      created_at: "1683000000000000000",
      updated_at: null,
      formatted_id: "Post:1"
    }]
  ],
  named_cyberlinks: [
    ["Post", 1],
    ["Comment", 2]
  ]
}
```

#### Cyberlinks (Paginated)
```typescript
// Query
interface CyberlinksQuery {
  cyberlinks: {
    start_after?: number;  // Optional: start after this ID
    limit?: number;        // Optional: max items to return (default: 50, max: 100)
  };
}

// Example request
const cyberlinksQuery: CyberlinksQuery = {
  cyberlinks: {
    start_after: 10,
    limit: 20
  }
};

// Response type
type CyberlinksResponse = [number, CyberlinkState][];

// Example response
[
  [11, {
    type: "Post",
    from: "user1",
    to: "Any",
    value: "Hello World!",
    owner: "wasm1...",
    created_at: "1683000000000000000",
    updated_at: null,
    formatted_id: "Post:11"
  }],
  // ... more cyberlinks
]
```

#### NamedCyberlinks (Paginated)
```typescript
// Query
interface NamedCyberlinksQuery {
  named_cyberlinks: {
    start_after?: string;  // Optional: start after this name
    limit?: number;        // Optional: max items to return (default: 50, max: 100)
  };
}

// Example request
const namedCyberlinksQuery: NamedCyberlinksQuery = {
  named_cyberlinks: {
    start_after: "Post",
    limit: 20
  }
};

// Response type
type NamedCyberlinksResponse = [string, number][];

// Example response
[
  ["Profile", 1],
  ["Type", 2],
  // ... more named cyberlinks
]
```

#### CyberlinksByIds
```typescript
// Query
interface CyberlinksByIdsQuery {
  cyberlinks_by_ids: {
    ids: number[];
  };
}

// Example request
const cyberlinksByIdsQuery: CyberlinksByIdsQuery = {
  cyberlinks_by_ids: {
    ids: [1, 2, 3]
  }
};

// Response type
type CyberlinksByIdsResponse = [number, CyberlinkState][];

// Example response
[
  [1, {
    type: "Post",
    from: "user1",
    to: "Any",
    value: "First post",
    owner: "wasm1...",
    created_at: "1683000000000000000",
    updated_at: null,
    formatted_id: "Post:1"
  }],
  // ... more cyberlinks
]
```

#### CyberlinksByOwner (Paginated)
```typescript
// Query
interface CyberlinksByOwnerQuery {
  cyberlinks_by_owner: {
    owner: string;
    start_after?: number;  // Optional: start after this ID
    limit?: number;        // Optional: max items to return (default: 50, max: 100)
  };
}

// Example request
const cyberlinksByOwnerQuery: CyberlinksByOwnerQuery = {
  cyberlinks_by_owner: {
    owner: "wasm1...",
    start_after: 10,
    limit: 20
  }
};

// Response type
type CyberlinksByOwnerResponse = [number, CyberlinkState][];

// Example response
[
  [11, {
    type: "Post",
    from: "user1",
    to: "Any",
    value: "Owner's post",
    owner: "wasm1...",
    created_at: "1683000000000000000",
    updated_at: null,
    formatted_id: "Post:11"
  }],
  // ... more cyberlinks
]
```

#### CyberlinksByOwnerTime (Paginated)
```typescript
// Query
interface CyberlinksByOwnerTimeQuery {
  cyberlinks_by_owner_time: {
    owner: string;
    start_time: string;    // Timestamp in nanoseconds
    end_time?: string;     // Optional: defaults to current block time
    start_after?: number;  // Optional: for pagination
    limit?: number;        // Optional: max items (default: 50, max: 100)
  };
}

// Example request
const cyberlinksByOwnerTimeQuery: CyberlinksByOwnerTimeQuery = {
  cyberlinks_by_owner_time: {
    owner: "wasm1...",
    start_time: "1683000000000000000",
    end_time: "1683100000000000000",
    start_after: 10,
    limit: 20
  }
};

// Response type
type CyberlinksByOwnerTimeResponse = [number, CyberlinkState][];

// Example response
[
  [11, {
    type: "Post",
    from: "user1",
    to: "Any",
    value: "Time-based post",
    owner: "wasm1...",
    created_at: "1683050000000000000",
    updated_at: null,
    formatted_id: "Post:11"
  }],
  // ... more cyberlinks
]
```

#### CyberlinksByOwnerTimeAny (Paginated)
```typescript
// Query
interface CyberlinksByOwnerTimeAnyQuery {
  cyberlinks_by_owner_time_any: {
    owner: string;
    start_time: string;    // Timestamp in nanoseconds
    end_time?: string;     // Optional: defaults to current block time
    start_after?: number;  // Optional: for pagination
    limit?: number;        // Optional: max items (default: 50, max: 100)
  };
}

// Example request
const cyberlinksByOwnerTimeAnyQuery: CyberlinksByOwnerTimeAnyQuery = {
  cyberlinks_by_owner_time_any: {
    owner: "wasm1...",
    start_time: "1683000000000000000",
    end_time: "1683100000000000000",
    start_after: 10,
    limit: 20
  }
};

// Response type
type CyberlinksByOwnerTimeAnyResponse = [number, CyberlinkState][];

// Example response
[
  [11, {
    type: "Post",
    from: "user1",
    to: "Any",
    value: "Updated post",
    owner: "wasm1...",
    created_at: "1683000000000000000",
    updated_at: "1683050000000000000",
    formatted_id: "Post:11"
  }],
  // ... more cyberlinks
]
```

#### CyberlinkByFormattedId
```typescript
// Query
interface CyberlinkByFormattedIdQuery {
  cyberlink_by_formatted_id: {
    formatted_id: string;
  };
}

// Example request
const cyberlinkByFormattedIdQuery: CyberlinkByFormattedIdQuery = {
  cyberlink_by_formatted_id: {
    formatted_id: "Post:1"
  }
};

// Response type
type CyberlinkByFormattedIdResponse = CyberlinkState;

// Example response
{
  type: "Post",
  from: "user1",
  to: "Any",
  value: "First post",
  owner: "wasm1...",
  created_at: "1683000000000000000",
  updated_at: null,
  formatted_id: "Post:1"
}
```

## Usage Examples

### Contract Instantiation
```typescript
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

async function instantiateContract() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic("your mnemonic");
  const client = await SigningCosmWasmClient.connectWithSigner(
    "http://localhost:26657",
    wallet,
    { gasPrice: GasPrice.fromString("0.025stake") }
  );

  const instantiateMsg: InstantiateMsg = {
    admins: ["wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s"],
    executers: ["wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s"],
    semantic_cores: ["Social", "Chat", "Lens"]
  };

  const fee = {
    amount: [{ amount: "1000", denom: "stake" }],
    gas: "200000"
  };

  const result = await client.instantiate(
    "wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s",
    1, // code ID
    instantiateMsg,
    "cw-social",
    fee
  );

  console.log("Contract instantiated:", result);
}
```

### Creating a Cyberlink
```typescript
async function createCyberlink() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic("your mnemonic");
  const client = await SigningCosmWasmClient.connectWithSigner(
    "http://localhost:26657",
    wallet,
    { gasPrice: GasPrice.fromString("0.025stake") }
  );

  const createCyberlinkMsg: CreateCyberlinkMsg = {
    create_cyberlink: {
      cyberlink: {
        type: "Follow",
        from: "user1",
        to: "user2"
      }
    }
  };

  const fee = {
    amount: [{ amount: "1000", denom: "stake" }],
    gas: "200000"
  };

  const result = await client.execute(
    "wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s",
    CONTRACT_ADDRESS,
    createCyberlinkMsg,
    fee
  );

  console.log("Cyberlink created:", result);
}
```

### Querying Cyberlinks
```typescript
async function queryCyberlinks() {
  const client = await SigningCosmWasmClient.connect("http://localhost:26657");

  const queryMsg: CyberlinksQuery = {
    cyberlinks: {
      limit: 10
    }
  };

  const result = await client.queryContractSmart(
    CONTRACT_ADDRESS,
    queryMsg
  );

  console.log("Cyberlinks:", result);
}
```

### Querying Cyberlinks by Owner
```typescript
async function queryCyberlinksByOwner() {
  const client = await SigningCosmWasmClient.connect("http://localhost:26657");

  const queryMsg: CyberlinksByOwnerQuery = {
    cyberlinks_by_owner: {
      owner: "wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s",
      limit: 10
    }
  };

  const result = await client.queryContractSmart(
    CONTRACT_ADDRESS,
    queryMsg
  );

  console.log("Owner's cyberlinks:", result);
}
```

### Querying Cyberlink by Formatted ID
```typescript
async function queryCyberlinkByFormattedId() {
  const client = await SigningCosmWasmClient.connect("http://localhost:26657");

  const queryMsg: CyberlinkByFormattedIdQuery = {
    cyberlink_by_formatted_id: {
      formatted_id: "Post:1"
    }
  };

  const result = await client.queryContractSmart(
    CONTRACT_ADDRESS,
    queryMsg
  );

  console.log("Cyberlink:", result);
}

## Error Handling

The contract may return the following errors:
- `Unauthorized`: The sender doesn't have permission to execute the action
- `InvalidCyberlink`: The cyberlink data is invalid
- `TypeNotExists`: The specified type doesn't exist
- `FromNotExists`: The source entity doesn't exist
- `ToNotExists`: The target entity doesn't exist
- `TypeConflict`: The cyberlink type conflicts with existing relationships
- `CannotChangeType`: Attempt to change the type of an existing cyberlink
- `CannotChangeLinks`: Attempt to change the 'from' or 'to' fields of an existing cyberlink
- `InvalidNameFormat`: The provided name contains invalid characters (e.g., colons)
- `DeletedCyberlink`: The cyberlink has been deleted
- `CannotMigrate`: Migration from a different contract type is not allowed
- `CannotMigrateVersion`: Migration from an unsupported version is not allowed

## Best Practices

1. Always validate input data before sending transactions
2. Handle errors appropriately in your application
3. Use appropriate gas limits and fees
4. Implement proper error handling for network issues
5. Cache query results when appropriate
6. Use pagination for large result sets
7. Implement proper security measures for admin operations

## Notes

- All timestamps should be in ISO 8601 format
- Maximum limit for pagination is 100 items
- Default limit is 50 items
- Gas prices and fees may vary based on network conditions
- Always test transactions on testnet before mainnet deployment
- Cyberlinks have both numeric IDs and formatted IDs (e.g., "Post:1")
- Type changes and link changes (from/to) are not allowed after creation

### Time Query Differences

The contract provides two different time-based query methods:

1. **cyberlinks_by_owner_time**
   - Only returns cyberlinks CREATED within the specified time range
   - Uses only the creation timestamp
   - More efficient for finding new cyberlinks
   - Use when you only care about when cyberlinks were created

2. **cyberlinks_by_owner_time_any**
   - Returns cyberlinks either CREATED or UPDATED within the time range
   - Checks both creation and update timestamps
   - More comprehensive but slightly less efficient
   - Use when you need to track both new and modified cyberlinks
   - Results are deduplicated (no duplicate IDs) and sorted
   - If a cyberlink was both created and updated in the time range, it appears only once

Example usage for finding modified content:
```typescript
// Find all cyberlinks created or modified in the last hour
const oneHourAgo = (Date.now() * 1000000).toString(); // Convert to nanos
const query: CyberlinksByOwnerTimeAnyQuery = {
  cyberlinks_by_owner_time_any: {
    owner: "wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s",
    start_time: oneHourAgo,
    limit: 50
  }
};
```

Example usage for finding only new content:
```typescript
// Find only newly created cyberlinks in the last hour
const oneHourAgo = (Date.now() * 1000000).toString(); // Convert to nanos
const query: CyberlinksByOwnerTimeQuery = {
  cyberlinks_by_owner_time: {
    owner: "wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s",
    start_time: oneHourAgo,
    limit: 50
  }
};
```