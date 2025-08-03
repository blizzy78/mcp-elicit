import { z } from 'zod';
const ElicitationResponseSchema = z.object({
    action: z.enum(['accept', 'decline', 'cancel']),
    content: z.any().optional(),
});
export function requestElicitation(server) {
    return async function (message, requestedSchema, responseContentSchema, answerExtractor) {
        const res = await server.request({
            method: 'elicitation/create',
            params: { message, requestedSchema },
        }, ElicitationResponseSchema);
        const action = res.action;
        const answer = res.content ? answerExtractor(responseContentSchema.parse(res.content)) : undefined;
        switch (action) {
            case 'accept':
                if (!answer) {
                    return {
                        content: [
                            {
                                type: 'text',
                                audience: ['assistant'],
                                text: JSON.stringify({ answer: null }),
                            },
                            {
                                type: 'text',
                                audience: ['assistant'],
                                text: "User didn't provide an answer.",
                            },
                        ],
                        structuredContent: { answer: null },
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            audience: ['assistant'],
                            text: JSON.stringify({ answer }),
                        },
                        {
                            type: 'text',
                            audience: ['assistant'],
                            text: `User answered with: ${answer}`,
                        },
                    ],
                    structuredContent: { answer },
                };
            case 'decline':
                return {
                    content: [
                        {
                            type: 'text',
                            audience: ['assistant'],
                            text: 'User declined to answer.',
                        },
                    ],
                    structuredContent: null,
                };
            case 'cancel':
                return {
                    content: [
                        {
                            type: 'text',
                            audience: ['assistant'],
                            text: 'User canceled the dialog.',
                        },
                    ],
                    structuredContent: null,
                };
            default:
                throw new Error(`Unknown elicitation action: ${action}`);
        }
    };
}
