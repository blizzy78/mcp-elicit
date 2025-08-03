import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { z } from 'zod'

type ElicitationRequestPropertySchemaBase = {
  title: string
  description?: string
}

type ElicitationRequestPropertySchema = (
  | {
      type: 'string'
      enum?: Array<string>
      enumNames?: Array<string>
      format?: 'email' | 'uri' | 'date' | 'date-time'
    }
  | { type: 'boolean' }
  | {
      type: 'number'
      minimum?: number
      maximum?: number
    }
) &
  ElicitationRequestPropertySchemaBase

export type ElicitationRequestObjectSchema = {
  type: 'object'
  properties: Record<string, ElicitationRequestPropertySchema>
}

const ElicitationResponseSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel']),
  content: z.any().optional(),
})

export type TextContent = {
  type: 'text'
  audience: Array<'user' | 'assistant'>
  text: string
}

export type ElicitationResult = {
  content: Array<TextContent>
  structuredContent: any
}

export type RequestElicitationFunction = <T extends object>(
  message: string,
  requestedSchema: ElicitationRequestObjectSchema,
  responseContentSchema: z.ZodType<T>,
  answerExtractor: (content: T) => string | undefined
) => Promise<ElicitationResult>

export function requestElicitation(server: Server) {
  return async function <T extends object>(
    message: string,
    requestedSchema: ElicitationRequestObjectSchema,
    responseContentSchema: z.ZodType<T>,
    answerExtractor: (content: T) => string | undefined
  ) {
    const res = await server.request(
      {
        method: 'elicitation/create',
        params: { message, requestedSchema },
      },

      ElicitationResponseSchema
    )

    const action = res.action
    const answer = res.content ? answerExtractor(responseContentSchema.parse(res.content)) : undefined

    switch (action) {
      case 'accept':
        if (!answer) {
          return {
            content: [
              {
                type: 'text',
                audience: ['assistant'],
                text: JSON.stringify({ answer: null }),
              } satisfies TextContent,

              {
                type: 'text',
                audience: ['assistant'],
                text: "User didn't provide an answer.",
              } satisfies TextContent,
            ],

            structuredContent: { answer: null },
          } satisfies ElicitationResult
        }

        return {
          content: [
            {
              type: 'text',
              audience: ['assistant'],
              text: JSON.stringify({ answer }),
            } satisfies TextContent,

            {
              type: 'text',
              audience: ['assistant'],
              text: `User answered with: ${answer}`,
            } satisfies TextContent,
          ],

          structuredContent: { answer },
        } satisfies ElicitationResult

      case 'decline':
        return {
          content: [
            {
              type: 'text',
              audience: ['assistant'],
              text: 'User declined to answer.',
            } satisfies TextContent,
          ],

          structuredContent: null,
        } satisfies ElicitationResult

      case 'cancel':
        return {
          content: [
            {
              type: 'text',
              audience: ['assistant'],
              text: 'User canceled the dialog.',
            } satisfies TextContent,
          ],

          structuredContent: null,
        } satisfies ElicitationResult

      default:
        throw new Error(`Unknown elicitation action: ${action}`)
    }
  } satisfies RequestElicitationFunction
}
