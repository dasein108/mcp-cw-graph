# CW-Social Smart Contract Documentation

## Overview

The CW-Social smart contract is a Cosmos SDK-based contract that implements a graph-based social network system. This documentation provides TypeScript examples using @cosmjs/cosmwasm-stargate for interacting with the contract.

## Contract Address

```typescript
const CONTRACT_ADDRESS = 'wasm1pvrwmjuusn9wh34j7y520g8gumuy9xtl3gvprlljfdpwju3x7ucsfg5rpz';
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
  type: string; // Required
  from?: string; // Optional
  to?: string; // Optional
  value?: string; // Optional
}

interface NamedCyberlink {
  id: string; // Required
  type: string; // Required
  from?: string; // Optional
  to?: string; // Optional
  value?: string; // Optional
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

interface CountsResponse {
  owner_count?: Uint64; // Total cyberlinks by owner
  typecount?: Uint64; // Total cyberlinks of type
  owner_typecount?: Uint64; // Total cyberlinks by owner of type
}
```

## Method and Query Reference

### Execute Methods

#### CreateNamedCyberlink

Creates a cyberlink with a custom string identifier. Admin-only operation.

- `name`: Required. Custom identifier for the cyberlink, must not contain colons
- `cyberlink`: Required. Cyberlink object containing type and optional from/to/value

#### CreateCyberlink

Creates a new cyberlink with an auto-generated formatted ID.

- `cyberlink`: Required. Cyberlink object with type and optional from/to/value fields

#### CreateCyberlink2

Creates a node and links it to an existing node in a single transaction.

- `node_type`: Required. Type of the new node to create
- `node_value`: Optional. Value/content of the new node
- `link_type`: Required. Type of the link between nodes
- `link_value`: Optional. Value/metadata for the link
- `link_from_existing_id`: Optional. ID of existing node to link from
- `link_to_existing_id`: Optional. ID of existing node to link to
  Note: Exactly one of link_from_existing_id or link_to_existing_id must be provided

#### CreateCyberlinks

Creates multiple cyberlinks in a single atomic transaction.

- `cyberlinks`: Required. Array of cyberlink objects to create

#### UpdateCyberlink

Updates the value of an existing cyberlink. Only the owner or admin can update.

- `fid`: Required. Formatted ID of the cyberlink
- `value`: Optional. New value for the cyberlink

#### DeleteCyberlink

Permanently removes a cyberlink. Only the owner or admin can delete.

- `fid`: Required. Formatted ID of the cyberlink to delete

#### UpdateAdmins

Updates the list of contract administrators. Admin-only operation.

- `new_admins`: Required. Array of addresses for the new admin list

#### UpdateExecutors

Updates the list of addresses allowed to execute operations. Admin-only operation.

- `new_executors`: Required. Array of addresses for the new executor list

### Query Methods

#### GetGraphStats

Retrieves statistics about cyberlinks in the graph.

- `owner`: Optional. Address to get stats for
- `type`: Optional. Type to get stats for

#### Config

Returns the current contract configuration.
No parameters required.

#### DebugState

Returns the complete state of the contract for debugging.
No parameters required.

#### LastGID

Returns the last used global ID number.
No parameters required.

#### CyberlinkByGID

Retrieves a cyberlink by its numeric ID.

- `gid`: Required. Global numeric ID of the cyberlink

#### CyberlinksByGIDs

Returns a paginated list of cyberlinks by their numeric IDs.

- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

#### CyberlinksSetByGIDs

Returns specific cyberlinks by their numeric IDs.

- `gids`: Required. Array of numeric IDs to retrieve

#### CyberlinkByFID

Retrieves a cyberlink by its formatted string ID.

- `fid`: Required. Formatted string ID (e.g., "Post:1")

#### CyberlinksByFIDs

Returns a paginated list of cyberlinks by their formatted IDs.

- `start_after_fid`: Optional. Formatted ID to start after
- `limit`: Optional. Maximum number of results to return

#### CyberlinksSetByFIDs

Returns specific cyberlinks by their formatted IDs.

- `fids`: Required. Array of formatted IDs to retrieve

#### CyberlinksByType

Returns cyberlinks of a specific type.

- `type`: Required. Type to filter by
- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

#### CyberlinksByFrom

Returns cyberlinks originating from a specific node.

- `from`: Required. Source node's formatted ID
- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

#### CyberlinksByTo

Returns cyberlinks pointing to a specific node.

- `to`: Required. Target node's formatted ID
- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

#### CyberlinksByOwner

Returns all cyberlinks owned by an address.

- `owner`: Required. Owner's address
- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

#### CyberlinksByOwnerAndType

Returns cyberlinks of a specific type owned by an address.

- `owner`: Required. Owner's address
- `type`: Required. Type to filter by
- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

#### CyberlinksByOwnerTime

Returns cyberlinks created by an owner within a time range.

- `owner`: Required. Owner's address
- `start_time`: Required. Start of time range in nanoseconds
- `end_time`: Optional. End of time range in nanoseconds
- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

#### CyberlinksByOwnerTimeAny

Returns cyberlinks created or updated by an owner within a time range.

- `owner`: Required. Owner's address
- `start_time`: Required. Start of time range in nanoseconds
- `end_time`: Optional. End of time range in nanoseconds
- `start_after_gid`: Optional. ID to start after for pagination
- `limit`: Optional. Maximum number of results to return

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
  admins: [
    'wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s',
    'wasm1ly7e3cdnlncpvy644cmgyrmd3s24gzjxwc2zk2',
  ],
  executers: [
    'wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s',
    'wasm1ly7e3cdnlncpvy644cmgyrmd3s24gzjxwc2zk2',
  ],
  semantic_cores: ['Social', 'Chat', 'Lens'],
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
    name: 'user_profile',
    cyberlink: {
      type: 'Profile',
      from: 'user1',
      to: 'user2',
      value: 'friend',
    },
  },
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
      type: 'Post', // Only type is required
    },
  },
};

// Example of cyberlink with optional fields
const createCyberlinkMsg2: CreateCyberlinkMsg = {
  create_cyberlink: {
    cyberlink: {
      type: 'Follow',
      from: 'user1', // Optional
      to: 'user2', // Optional
      value: 'friend', // Optional
    },
  },
};
```

#### CreateCyberlink2 (New)

```typescript
interface CreateCyberlink2Msg {
  create_cyberlink2: {
    node_type: string;
    node_value?: string;
    link_type: string;
    link_value?: string;
    link_from_existing_id?: string;
    link_to_existing_id?: string;
  };
}

// Example: Create a post and link it to a user profile
const createCyberlink2Msg: CreateCyberlink2Msg = {
  create_cyberlink2: {
    node_type: 'Post',
    node_value: 'Hello World!',
    link_type: 'Created',
    link_value: '2024-03-20',
    link_from_existing_id: 'Profile:1', // Links from existing profile to new post
  },
};
```

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
        type: 'Follow', // Minimal cyberlink with only type
      },
      {
        type: 'Like',
        from: 'user1', // With optional fields
        to: 'post1',
        value: '❤️',
      },
    ],
  },
};
```

#### UpdateCyberlink

```typescript
interface UpdateCyberlinkMsg {
  update_cyberlink: {
    fid: string; // Formatted ID of the cyberlink
    value?: string | null; // Optional new value
  };
}

// Example
const updateCyberlinkMsg: UpdateCyberlinkMsg = {
  update_cyberlink: {
    fid: 'Post:1',
    value: 'Updated content',
  },
};
```

#### DeleteCyberlink

```typescript
interface DeleteCyberlinkMsg {
  delete_cyberlink: {
    fid: string; // Formatted ID of the cyberlink to delete
  };
}

// Example
const deleteCyberlinkMsg: DeleteCyberlinkMsg = {
  delete_cyberlink: {
    fid: 'Post:1',
  },
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
    new_admins: ['wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s', 'wasm1...'],
  },
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
    new_executors: ['wasm19j47gw2254lercpznvg4dlf8y2pmqh37ey009s', 'wasm1...'],
  },
};
```

### Query Messages

Each query example below includes:

- The query message structure
- Example request
- Expected response type
- Example response

#### LastGID

```typescript
// Query
interface LastGIDQuery {
  last_g_i_d: Record<string, never>;
}

// Example request
const lastGIDQuery: LastGIDQuery = {
  last_g_i_d: {},
};

// Response type
type LastGIDResponse = Uint64;

// Example response
('42'); // string representation of Uint64
```

#### CyberlinkByGID

```typescript
// Query
interface CyberlinkByGIDQuery {
  cyberlink_by_g_i_d: {
    gid: Uint64;
  };
}

// Example request
const cyberlinkByGIDQuery: CyberlinkByGIDQuery = {
  cyberlink_by_g_i_d: {
    gid: '1',
  },
};

// Response type
type CyberlinkByGIDResponse = CyberlinkState;
```

#### CyberlinksByGIDs

```typescript
// Query
interface CyberlinksByGIDsQuery {
  cyberlinks_by_g_i_ds: {
    start_after_gid?: number;
    limit?: number;
  };
}

// Example request
const cyberlinksQuery: CyberlinksByGIDsQuery = {
  cyberlinks_by_g_i_ds: {
    start_after_gid: 10,
    limit: 20,
  },
};

// Response type
type CyberlinksByGIDsResponse = [number, CyberlinkState][];
```

#### CyberlinksSetByGIDs

```typescript
// Query
interface CyberlinksSetByGIDsQuery {
  cyberlinks_set_by_g_i_ds: {
    gids: number[];
  };
}

// Example request
const cyberlinksSetQuery: CyberlinksSetByGIDsQuery = {
  cyberlinks_set_by_g_i_ds: {
    gids: [1, 2, 3],
  },
};

// Response type
type CyberlinksSetByGIDsResponse = [number, CyberlinkState][];
```

#### CyberlinkByFID

```typescript
// Query
interface CyberlinkByFIDQuery {
  cyberlink_by_f_i_d: {
    fid: string;
  };
}

// Example request
const cyberlinkByFIDQuery: CyberlinkByFIDQuery = {
  cyberlink_by_f_i_d: {
    fid: 'Post:1',
  },
};

// Response type
type CyberlinkByFIDResponse = CyberlinkState;
```

#### CyberlinksByFIDs

```typescript
// Query
interface CyberlinksByFIDsQuery {
  cyberlinks_by_f_i_ds: {
    start_after_fid?: string;
    limit?: number;
  };
}

// Example request
const cyberlinksByFIDsQuery: CyberlinksByFIDsQuery = {
  cyberlinks_by_f_i_ds: {
    start_after_fid: 'Post:10',
    limit: 20,
  },
};

// Response type
type CyberlinksByFIDsResponse = [string, CyberlinkState][];
```

#### CyberlinksSetByFIDs

```typescript
// Query
interface CyberlinksSetByFIDsQuery {
  cyberlinks_set_by_f_i_ds: {
    fids: string[];
  };
}

// Example request
const cyberlinksSetByFIDsQuery: CyberlinksSetByFIDsQuery = {
  cyberlinks_set_by_f_i_ds: {
    fids: ['Post:1', 'Post:2', 'Post:3'],
  },
};

// Response type
type CyberlinksSetByFIDsResponse = [string, CyberlinkState][];
```

#### CyberlinksByType

```typescript
// Query
interface CyberlinksByTypeQuery {
  cyberlinks_by_type: {
    type: string;
    start_after_gid?: number;
    limit?: number;
  };
}

// Example request
const cyberlinksByTypeQuery: CyberlinksByTypeQuery = {
  cyberlinks_by_type: {
    type: 'Post',
    start_after_gid: 10,
    limit: 20,
  },
};

// Response type
type CyberlinksByTypeResponse = [number, CyberlinkState][];
```

#### CyberlinksByOwnerAndType

```typescript
// Query
interface CyberlinksByOwnerAndTypeQuery {
  cyberlinks_by_owner_and_type: {
    owner: string;
    type: string;
    start_after_gid?: number;
    limit?: number;
  };
}

// Example request
const cyberlinksByOwnerAndTypeQuery: CyberlinksByOwnerAndTypeQuery = {
  cyberlinks_by_owner_and_type: {
    owner: 'wasm1...',
    type: 'Post',
    start_after_gid: 10,
    limit: 20,
  },
};

// Response type
type CyberlinksByOwnerAndTypeResponse = [number, CyberlinkState][];
```

#### GetGraphStats

```typescript
// Query
interface GetGraphStatsQuery {
  get_graph_stats: {
    owner?: string;
    type?: string;
  };
}

// Example request
const getGraphStatsQuery: GetGraphStatsQuery = {
  get_graph_stats: {
    owner: 'wasm1...',
    type: 'Post',
  },
};

// Response type
interface CountsResponse {
  owner_count?: Uint64; // Total cyberlinks by owner
  typecount?: Uint64; // Total cyberlinks of type
  owner_typecount?: Uint64; // Total cyberlinks by owner of type
}
```

## Graph Building Scenarios

### 1. Social Network Graph

```typescript
// Create user profiles
{
  create_named_cyberlink: {
    name: "user1",
    cyberlink: {
      type: "Profile",
      value: "{ \"name\": \"Alice\", \"bio\": \"Blockchain Developer\" }"
    }
  }
}

// Create follow relationships
{
  create_cyberlink: {
    cyberlink: {
      type: "Follow",
      from: "user1",
      to: "user2"
    }
  }
}

// Create friendship relationships
{
  create_cyberlink: {
    cyberlink: {
      type: "Friend",
      from: "user1",
      to: "user2",
      value: "close_friend"
    }
  }
}
```

### 2. Content Graph

```typescript
// Create content type
{
  create_named_cyberlink: {
    name: "post1",
    cyberlink: {
      type: "Post",
      value: "{ \"content\": \"Hello World\", \"timestamp\": \"...\" }"
    }
  }
}

// Create content relationships
{
  create_cyberlink: {
    cyberlink: {
      type: "Like",
      from: "user1",
      to: "post1"
    }
  }
}

// Create content hierarchy
{
  create_cyberlink: {
    cyberlink: {
      type: "Comment",
      from: "comment1",
      to: "post1",
      value: "Great post!"
    }
  }
}
```

### 3. Knowledge Graph (New)

```typescript
// Create a concept node and link it to a definition
{
  create_cyberlink2: {
    node_type: "Concept",
    node_value: "Blockchain",
    link_type: "Definition",
    link_value: "A decentralized, distributed ledger technology",
    link_to_existing_id: "Reference:1",
    link_from_existing_id: "Reference:2",
  }
}

// Create relationships between concepts
{
  create_cyberlink: {
    cyberlink: {
      type: "RelatedTo",
      from: "Concept:1",
      to: "Concept:2",
      value: "is_prerequisite_for"
    }
  }
}
```

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
8. Use `CreateCyberlink2` for complex node-link relationships
9. Utilize graph statistics for monitoring and analytics
10. Follow semantic core guidelines for type consistency

## Notes

- All timestamps are in nanoseconds since the Unix epoch
- Maximum limit for pagination is 100 items
- Default limit is 50 items
- Gas prices and fees may vary based on network conditions
- Always test transactions on testnet before mainnet deployment
- Cyberlinks have both numeric IDs (GID) and formatted IDs (FID, e.g., "Post:1")
- Type changes and link changes (from/to) are not allowed after creation
- The contract supports semantic cores for predefined type systems

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

### Statistics and Counters

The contract maintains several counters for analytics:

- Total cyberlinks per owner
- Total cyberlinks per type
- Total cyberlinks per owner per type

These can be queried using the `GetGraphStats` endpoint:

```typescript
// Get all stats for a user
const query = {
  get_graph_stats: {
    owner: 'wasm1...',
  },
};

// Get stats for a specific type
const query = {
  get_graph_stats: {
    type: 'Post',
  },
};

// Get combined stats
const query = {
  get_graph_stats: {
    owner: 'wasm1...',
    type: 'Post',
  },
};
```

### ID Types

The contract uses two types of IDs:

1. **Global ID (GID)**

   - Numeric, auto-incrementing identifier
   - Internal use and efficient indexing
   - Used in many query responses

2. **Formatted ID (FID)**
   - String format: "{type}:{number}"
   - More human-readable
   - Used in most user-facing operations
   - Required for update and delete operations
