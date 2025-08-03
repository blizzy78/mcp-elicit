import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { type RequestElicitationFunction } from './elicitation.js'

export const ElicitBooleanArgsSchema = z.object({
  question: z
    .string()
    .min(1)
    .describe('A concise question that can be answered with a Boolean response (yes/no, true/false, on/off etc.)'),
  questionDescription: z
    .string()
    .min(1)
    .optional()
    .describe('An optional concise description for the requested information.'),
})

export type ElicitBooleanArgs = z.infer<typeof ElicitBooleanArgsSchema>

export const ELICIT_BOOLEAN = 'elicit_boolean'

export const elicitBooleanTool = {
  name: ELICIT_BOOLEAN,
  title: 'Request Boolean from user',
  description: `A tool to prompt the user for a Boolean response (yes/no, true/false, on/off etc.).
Only provide a brief question. Make sure that the question avoids double negatives.
Avoid using lengthy phrases like 'Please select ...' etc.`,
  inputSchema: zodToJsonSchema(ElicitBooleanArgsSchema),
}

export async function handleElicitBoolean(
  { question: title, questionDescription: description }: ElicitBooleanArgs,
  requestElicitation: RequestElicitationFunction
) {
  return requestElicitation(
    title,

    {
      type: 'object',
      properties: {
        answer: {
          type: 'boolean',
          title,
          description,
        },
      },
    },

    z.object({ answer: z.any().nullable().optional() }),

    (content) => (content.answer && typeof content.answer === 'boolean' ? content.answer.toString() : undefined)
  )
}
