import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { requestElicitation } from './tools/elicitation.js';
import { toolHandlers, tools } from './tools/index.js';
export function createServer() {
    const server = new Server({
        name: 'elicit',
        title: 'Elicitation',
        version: '0.2.0',
    }, {
        capabilities: {
            tools: {},
            elicitation: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, () => {
        return { tools };
    });
    const reqElicit = requestElicitation(server);
    server.setRequestHandler(CallToolRequestSchema, async ({ params: { name, arguments: args } }) => {
        const toolHandler = toolHandlers[name];
        if (!toolHandler) {
            throw new Error(`Unknown tool: ${name}`);
        }
        const parsedArgs = toolHandler.schema.parse(args);
        return await toolHandler.handler(parsedArgs, reqElicit);
    });
    return { server, cleanup: () => { } };
}
