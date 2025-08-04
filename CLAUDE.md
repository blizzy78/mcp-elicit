# Elicitation MCP Server

## Project Description

The Elicitation MCP Server is a Model Context Protocol (MCP) server that provides user elicitation capabilities for AI applications. The server enables AI assistants to prompt users for structured input through various elicitation tools, supporting different data types and validation patterns. It acts as a bridge between AI systems and human users, allowing for interactive data gathering in conversational AI workflows.

The project implements the MCP specification and provides a comprehensive set of tools for soliciting user input, including free-form text, multiple choice options, numbers, booleans, dates, email addresses, and URIs. Each interaction supports user actions to accept, decline, or cancel prompts, providing a robust user experience.

## High-Level Architecture

### Transport Layer Architecture

The project follows a modular transport pattern with three distinct communication protocols:

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client    │    │  MCP Transport   │    │  Elicit Server  │
│             │◄──►│                  │◄──►│                 │
│   (AI/Bot)  │    │ • STDIO          │    │ • Tool Registry │
│             │    │ • SSE            │    │ • Elicitation   │
└─────────────┘    │ • HTTP           │    │ • Validation    │
                   └──────────────────┘    └─────────────────┘
```

**Transport Implementations:**
- **STDIO (`stdio.ts`)**: Command-line interface using standard input/output for direct integration with CLI applications
- **SSE (`sse.ts`)**: Server-Sent Events over HTTP for web-based real-time communication with session management
- **HTTP (`streamableHttp.ts`)**: Full HTTP server with session management, resumability, and connection lifecycle handling

**Core Components:**
- **Entry Point (`index.ts`)**: Dynamic transport dispatcher that loads the appropriate communication module based on command-line arguments
- **Server Factory (`elicit.ts`)**: Creates configured MCP server instances with tool capabilities and elicitation features
- **Tool Registry (`tools/index.ts`)**: Centralized registry of all available elicitation tools with handlers and schemas

### Tool Architecture

The elicitation tools follow a consistent architectural pattern:

```
┌────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  Tool Handler  │    │   Elicitation   │    │   User Response  │
│                │    │   Framework     │    │                  │
│ • Validation   │───►│                 │───►│ • Accept/Decline │
│ • Schema Gen   │    │ • Request/Resp  │    │ • Cancel         │
│ • Response     │    │ • State Mgmt    │    │ • Structured     │
└────────────────┘    └─────────────────┘    └──────────────────┘
```

**Available Tools:**
- `elicit_information`: Free-form text input
- `elicit_options`: Multiple choice selection
- `elicit_boolean`: Yes/no prompts
- `elicit_number`: Numeric input with optional min/max constraints
- `elicit_date_time`: Date and time input
- `elicit_email`: Email address input with format validation
- `elicit_uri`: URI input with format validation

**Tool Features:**
- **Schema Validation**: Each tool uses Zod schemas for runtime type checking and JSON Schema generation
- **Structured Responses**: Tools return both human-readable text and structured data for programmatic use
- **Error Handling**: Comprehensive error handling with validation feedback
- **Extensibility**: Consistent interfaces allow easy addition of new elicitation types

### Data Flow Architecture

```
1. Client Request ──► Transport ──► MCP Server ──► Tool Handler
                                                      │
                                                      ▼
5. Client Response ◄── Transport ◄── MCP Server ◄── Elicitation Request
                                         ▲                │
                                         │                ▼
4. User Response ──► Elicitation Response ◄────────── 2. User Prompt
                                                      │
                                                      ▼
                                                 3. User Input
```

## High-Level Testing Procedures

### Testing Framework

The project uses **Vitest** as the primary testing framework with the following configuration:

- **Test Environment**: Node.js environment for server-side testing
- **Test Discovery**: Automatic discovery of `*.test.ts` and `*.spec.ts` files
- **Global Utilities**: Vitest globals enabled for streamlined test writing
- **Coverage Provider**: V8 coverage provider for accurate code coverage metrics

### Testing Strategy

**Unit Testing Approach:**
- **Tool Testing**: Each elicitation tool has comprehensive unit tests covering all scenarios
- **Workflow Simulation**: Tests simulate complete user interaction workflows (accept/decline/cancel)
- **Schema Validation**: Validation of input arguments and response schemas
- **Error Handling**: Testing of error conditions and edge cases
- **Constraint Testing**: Validation of input constraints (min/max values, required fields)

**Test Patterns:**
- **AAA Pattern**: Arrange-Act-Assert structure for clear test organization
- **Dependency Mocking**: Comprehensive mocking of external dependencies using Vitest's `vi.fn()`
- **Integration Testing**: Testing tool handlers with mocked elicitation functions
- **Boundary Testing**: Testing edge cases and validation boundaries

**Coverage Strategy:**
- **Focused Coverage**: Excludes infrastructure files (entry points, transport layers) from coverage metrics
- **Core Logic Coverage**: Focuses coverage on business logic and tool implementations
- **Test Exclusion**: Test files themselves are excluded from coverage calculations

### Testing Commands

```bash
# Run tests once
pnpm run test

# Run tests with coverage report
pnpm run test:coverage
```

### Testing Scope

**Covered Areas:**
- Tool handler functionality and response formatting
- Schema validation and type safety
- User interaction workflow simulation
- Error propagation and handling
- Constraint validation (numeric ranges, required fields)
- Elicitation framework request/response cycle

**Testing Exclusions:**
- Transport layer implementations (complex integration scenarios)
- Server initialization and connection handling
- Express.js middleware and HTTP handling
- Session management and cleanup procedures

The testing approach ensures reliability of the core elicitation functionality while acknowledging that transport layer testing would require more complex integration test setups.
