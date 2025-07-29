import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
export const ElicitEmailArgsSchema = z.object({
    requestedEmailTitle: z.string().min(1).describe('A concise title for the requested email.'),
    requestedEmailDescription: z
        .string()
        .min(1)
        .optional()
        .describe('An optional concise description for the requested information.'),
});
export const ELICIT_EMAIL = 'elicit_email';
export const elicitEmailTool = {
    name: ELICIT_EMAIL,
    description: `A tool to prompt the user for an email address input.
Only provide a brief title for the information being requested.
Avoid using lengthy phrases like 'Please provide ...' etc.`,
    inputSchema: zodToJsonSchema(ElicitEmailArgsSchema),
};
export async function handleElicitEmail({ requestedEmailTitle: title, requestedEmailDescription: description }, requestElicitation) {
    return requestElicitation(title, {
        type: 'object',
        properties: {
            answer: {
                type: 'string',
                title,
                description,
                format: 'email',
            },
        },
    }, z.object({ answer: z.string().nullable().optional() }), (content) => content.answer && typeof content.answer === 'string' && content.answer.trim() !== '' ? content.answer : undefined);
}
