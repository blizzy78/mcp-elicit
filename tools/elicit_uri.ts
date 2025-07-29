import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { type RequestElicitationFunction } from './elicitation.js'

export const ElicitUriArgsSchema = z.object({
  requestedUriTitle: z.string().min(1).describe('A concise title for the requested URI.'),
  requestedUriDescription: z
    .string()
    .min(1)
    .optional()
    .describe('An optional concise description for the requested information.'),
})

export type ElicitUriArgs = z.infer<typeof ElicitUriArgsSchema>

export const ELICIT_URI = 'elicit_uri'

export const elicitUriTool = {
  name: ELICIT_URI,
  description: `A tool to prompt the user for a URI input.
Only provide a brief title for the information being requested.
Avoid using lengthy phrases like 'Please provide ...' etc.`,
  inputSchema: zodToJsonSchema(ElicitUriArgsSchema),
}

export async function handleElicitUri(
  { requestedUriTitle: title, requestedUriDescription: description }: ElicitUriArgs,
  requestElicitation: RequestElicitationFunction
) {
  return requestElicitation(
    title,

    {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          title,
          description,
          format: 'uri',
        },
      },
    },

    z.object({ answer: z.string().nullable().optional() }),

    (content) =>
      content.answer && typeof content.answer === 'string' && content.answer.trim() !== '' ? content.answer : undefined
  )
}
