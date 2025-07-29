# Elicitation MCP Server

This MCP server allows agents to request information directly from the user, such as text, numbers, etc.


## Tools

1. `elicit_information`
   - A tool to request information directly from the user, as a free-form text input
   - Inputs:
     - `requestedInformationTitle` (string): A concise title for the requested information
     - `requestedInformationDescription` (string, optional): An optional concise description for the requested information
   - Returns: Text content with user's response ("User answered with: {answer}"), or notification if user declined/canceled

2. `elicit_options`
   - A tool to prompt the user to select from a list of options
   - Inputs:
     - `requestedInformationTitle` (string): A concise title for the requested information
     - `requestedInformationDescription` (string, optional): An optional concise description for the requested information
     - `options` (array of strings): An array of option values to choose from
     - `optionNames` (array of strings, optional): An optional array of human-readable names for the options. Must match the length and order of options if provided
   - Returns: Text content with user's selected option ("User answered with: {selection}"), or notification if user declined/canceled

3. `elicit_boolean`
   - A tool to prompt the user for a Boolean response (yes/no, true/false, on/off etc.)
   - Inputs:
     - `question` (string): A concise question that can be answered with a Boolean response
     - `questionDescription` (string, optional): An optional concise description for the requested information
   - Returns: Text content with user's boolean response ("User answered with: true/false"), or notification if user declined/canceled

4. `elicit_number`
   - A tool to prompt the user for a number input
   - Inputs:
     - `requestedNumberTitle` (string): A concise title for the requested number
     - `requestedNumberDescription` (string, optional): An optional concise description for the requested information
     - `minimum` (number, optional): An optional minimum value constraint
     - `maximum` (number, optional): An optional maximum value constraint
   - Returns: Text content with user's number input ("User answered with: {number}"), or notification if user declined/canceled

5. `elicit_date_time`
   - A tool to prompt the user for a date or date-time input
   - Inputs:
     - `requestedDateTimeTitle` (string): A concise title for the requested date/time
     - `requestedDateTimeDescription` (string, optional): An optional concise description for the requested information
     - `format` (enum: "date" | "date-time", default: "date"): The format for the date/time input. 'date' for date only, 'date-time' for date and time
   - Returns: Text content with user's date/time input ("User answered with: {date}"), or notification if user declined/canceled

6. `elicit_email`
   - A tool to prompt the user for an email address input
   - Inputs:
     - `requestedEmailTitle` (string): A concise title for the requested email
     - `requestedEmailDescription` (string, optional): An optional concise description for the requested information
   - Returns: Text content with user's email input ("User answered with: {email}"), or notification if user declined/canceled

7. `elicit_uri`
   - A tool to prompt the user for a URI input
   - Inputs:
     - `requestedUriTitle` (string): A concise title for the requested URI
     - `requestedUriDescription` (string, optional): An optional concise description for the requested information
   - Returns: Text content with user's URI input ("User answered with: {uri}"), or notification if user declined/canceled


## Usage with Claude Desktop (uses [stdio Transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#stdio))

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "elicit": {
      "command": "npx",
      "args": [
        "-y",
        "@blizzy/mcp-elicit"
      ]
    }
  }
}
```


## Usage with VS Code

For quick installation, use of of the one-click install buttons below.

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=elicit&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40blizzy%2Fmcp-elicit%22%5D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=elicit&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40blizzy%2Fmcp-elicit%22%5D%7D&quality=insiders)

<!--
[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=elicit&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22-i%22%2C%22--rm%22%2C%22mcp%2Felicit%22%5D%7D) [![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=elicit&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22-i%22%2C%22--rm%22%2C%22mcp%2Felicit%22%5D%7D&quality=insiders)
-->

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.


#### NPX

```json
{
  "mcp": {
    "servers": {
      "elicit": {
        "command": "npx",
        "args": ["-y", "@blizzy/mcp-elicit"]
      }
    }
  }
}
```


## Running from source with [HTTP+SSE Transport](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse) (deprecated as of [2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports))

```shell
pnpm install
pnpm run start:sse
```


## Run from source with [Streamable HTTP Transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http)

```shell
pnpm install
pnpm run start:streamableHttp
```


## Running as an installed package

### Install

```shell
npm install -g @blizzy/mcp-elicit@latest
````


### Run the default (stdio) server

```shell
npx @blizzy/mcp-elicit
```


### Or specify stdio explicitly

```shell
npx @blizzy/mcp-elicit stdio
```


### Run the SSE server

```shell
npx @blizzy/mcp-elicit sse
```


### Run the streamable HTTP server

```shell
npx @blizzy/mcp-elicit streamableHttp
```


## License

This package is licensed under the MIT license.
