import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { type RequestElicitationFunction } from './elicitation.js'

export const ElicitInformationArgsSchema = z.object({
  requestedInformationTitle: z.string().min(1).describe('A concise title for the requested information.'),
  requestedInformationDescription: z
    .string()
    .min(1)
    .optional()
    .describe('An optional concise description for the requested information.'),
})

export type ElicitInformationArgs = z.infer<typeof ElicitInformationArgsSchema>

export const ELICIT_INFORMATION = 'elicit_information'

export const elicitInformationTool = {
  name: ELICIT_INFORMATION,
  description: `A tool to request information directly from the user, as a free-form text input.
Only provide a brief title for the information being requested.
Avoid using lengthy phrases like 'Please provide ...' etc.`,
  inputSchema: zodToJsonSchema(ElicitInformationArgsSchema),
}

export async function handleElicitInformation(
  { requestedInformationTitle: title, requestedInformationDescription: description }: ElicitInformationArgs,
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
        },
      },
    },

    z.object({ answer: z.string().min(1).nullable().optional() }),

    (content) =>
      content.answer && typeof content.answer === 'string' && content.answer.trim() !== '' ? content.answer : undefined
  )
}
