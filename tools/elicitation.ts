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

export type ElicitSingleTextResponse = {
  type: 'text'
  text: string
}

export type RequestElicitationFunction = <T extends object>(
  message: string,
  requestedSchema: ElicitationRequestObjectSchema,
  responseContentSchema: z.ZodType<T>,
  answerExtractor: (content: T) => string | undefined
) => Promise<{
  content: [ElicitSingleTextResponse]
}>

export function requestElicitation(server: Server) {
  return async function <T extends object>(
    message: string,
    requestedSchema: ElicitationRequestObjectSchema,
    responseContentSchema: z.ZodType<T>,
    answerExtractor: (content: T) => string | undefined
  ) {
    const req = {
      method: 'elicitation/create',
      params: { message, requestedSchema },
    }

    const res = await server.request(req, ElicitationResponseSchema)
    const action = res.action
    const answer = res.content ? answerExtractor(responseContentSchema.parse(res.content)) : undefined

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
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `User answered with: ${answer}`,
            },
          ],
        }

      case 'decline':
        return {
          content: [
            {
              type: 'text',
              text: 'User declined to answer.',
            },
          ],
        }

      case 'cancel':
        return {
          content: [
            {
              type: 'text',
              text: 'User canceled the dialog.',
            },
          ],
        }

      default:
        throw new Error(`Unknown elicitation action: ${action}`)
    }
  } satisfies RequestElicitationFunction
}
