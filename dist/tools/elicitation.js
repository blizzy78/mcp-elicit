import { z } from 'zod';
const ElicitationResponseSchema = z.object({
    action: z.enum(['accept', 'decline', 'cancel']),
    content: z.any().optional(),
});
export function requestElicitation(server) {
    return async function (message, requestedSchema, responseContentSchema, answerExtractor) {
        const req = {
            method: 'elicitation/create',
            params: { message, requestedSchema },
        };
        const res = await server.request(req, ElicitationResponseSchema);
        const action = res.action;
        const answer = res.content ? answerExtractor(responseContentSchema.parse(res.content)) : undefined;
        switch (action) {
            case 'accept':
                if (!answer) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: "User didn't provide an answer.",
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `User answered with: ${answer}`,
                        },
                    ],
                };
            case 'decline':
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'User declined to answer.',
                        },
                    ],
                };
            case 'cancel':
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'User canceled the dialog.',
                        },
                    ],
                };
            default:
                throw new Error(`Unknown elicitation action: ${action}`);
        }
    };
}
