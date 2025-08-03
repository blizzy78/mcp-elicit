import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
export const ElicitOptionsArgsSchema = z.object({
    requestedInformationTitle: z.string().min(1).describe('A concise title for the requested information.'),
    requestedInformationDescription: z
        .string()
        .min(1)
        .optional()
        .describe('An optional concise description for the requested information.'),
    options: z.string().min(1).array().min(1).describe('An array of option values to choose from.'),
    optionNames: z
        .string()
        .min(1)
        .array()
        .min(1)
        .optional()
        .describe('An optional array of human-readable names for the options. Must match the length and order of options if provided.'),
});
export const ELICIT_OPTIONS = 'elicit_options';
export const elicitOptionsTool = {
    name: ELICIT_OPTIONS,
    title: 'Request information from user',
    description: `A tool to prompt the user to select from a list of options.
Only provide a brief title for the information being requested.
Avoid using lengthy phrases like 'Please select ...' etc.`,
    inputSchema: zodToJsonSchema(ElicitOptionsArgsSchema),
};
export async function handleElicitOptions({ requestedInformationTitle: title, requestedInformationDescription: description, options, optionNames, }, requestElicitation) {
    if (optionNames && optionNames.length !== options.length) {
        throw new Error('optionNames array must have the same length as options array');
    }
    return requestElicitation(title, {
        type: 'object',
        properties: {
            answer: {
                type: 'string',
                title,
                description,
                enum: options,
                enumNames: optionNames ?? options,
            },
        },
    }, z.object({ answer: z.string().min(1).nullable().optional() }), (content) => content.answer && typeof content.answer === 'string' && content.answer.trim() !== '' ? content.answer : undefined);
}
