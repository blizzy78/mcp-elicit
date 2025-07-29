import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
export const ElicitDateTimeArgsSchema = z.object({
    requestedDateTimeTitle: z.string().min(1).describe('A concise title for the requested date/time.'),
    requestedDateTimeDescription: z
        .string()
        .min(1)
        .optional()
        .describe('An optional concise description for the requested information.'),
    format: z
        .enum(['date', 'date-time'])
        .default('date')
        .describe("The format for the date/time input. 'date' for date only, 'date-time' for date and time."),
});
export const ELICIT_DATE_TIME = 'elicit_date_time';
export const elicitDateTimeTool = {
    name: ELICIT_DATE_TIME,
    description: `A tool to prompt the user for a date or date-time input.
Only provide a brief title for the information being requested.
Avoid using lengthy phrases like 'Please provide ...' etc.
You can choose between date-only or date-time format.`,
    inputSchema: zodToJsonSchema(ElicitDateTimeArgsSchema),
};
export async function handleElicitDateTime({ requestedDateTimeTitle: title, requestedDateTimeDescription: description, format }, requestElicitation) {
    return requestElicitation(title, {
        type: 'object',
        properties: {
            answer: {
                type: 'string',
                title,
                description,
                format,
            },
        },
    }, z.object({ answer: z.string().nullable().optional() }), (content) => content.answer && typeof content.answer === 'string' && content.answer.trim() !== '' ? content.answer : undefined);
}
