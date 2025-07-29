import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { type ElicitationRequestObjectSchema, type RequestElicitationFunction } from './elicitation.js'

export const ElicitNumberArgsSchema = z.object({
  requestedNumberTitle: z.string().min(1).describe('A concise title for the requested number.'),
  requestedNumberDescription: z
    .string()
    .min(1)
    .optional()
    .describe('An optional concise description for the requested information.'),
  minimum: z.number().optional().describe('An optional minimum value constraint.'),
  maximum: z.number().optional().describe('An optional maximum value constraint.'),
})

export type ElicitNumberArgs = z.infer<typeof ElicitNumberArgsSchema>

export const ELICIT_NUMBER = 'elicit_number'

export const elicitNumberTool = {
  name: ELICIT_NUMBER,
  description: `A tool to prompt the user for a number input.
Only provide a brief title for the information being requested.
Avoid using lengthy phrases like 'Please provide ...' etc.
You can optionally specify minimum and maximum constraints.`,
  inputSchema: zodToJsonSchema(ElicitNumberArgsSchema),
}

export async function handleElicitNumber(
  { requestedNumberTitle: title, requestedNumberDescription: description, minimum, maximum }: ElicitNumberArgs,
  requestElicitation: RequestElicitationFunction
) {
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    throw new Error('minimum value must be less than or equal to maximum value')
  }

  const objSchema: ElicitationRequestObjectSchema = {
    type: 'object',
    properties: {
      answer: {
        type: 'number',
        title,
        description,
      },
    },
  }

  if (objSchema.properties.answer.type === 'number') {
    if (minimum !== undefined) {
      objSchema.properties.answer.minimum = minimum
    }

    if (maximum !== undefined) {
      objSchema.properties.answer.maximum = maximum
    }
  }

  return requestElicitation(
    title,
    objSchema,
    z.object({ answer: z.number().nullable().optional() }),

    (content) => (content.answer && typeof content.answer === 'number' ? content.answer.toString(10) : undefined)
  )
}
