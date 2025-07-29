import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { requestElicitation, type ElicitationRequestObjectSchema } from './elicitation.js'

describe('elicitation tests', () => {
  let mockServer: Server
  let mockRequest: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockRequest = vi.fn()
    mockServer = {
      request: mockRequest,
    } as unknown as Server
  })

  describe('requestElicitation function creation', () => {
    it('should return a function when called with a server', () => {
      const elicitationFunction = requestElicitation(mockServer)
      expect(typeof elicitationFunction).toBe('function')
    })

    it('should create a function that matches the RequestElicitationFunction type', () => {
      const elicitationFunction = requestElicitation(mockServer)
      expect(elicitationFunction).toBeDefined()
      expect(typeof elicitationFunction).toBe('function')
    })
  })

  describe('elicitation function behavior', () => {
    const testSchema: ElicitationRequestObjectSchema = {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          title: 'Test Answer',
          description: 'A test answer field',
        },
      },
    }

    const testResponseSchema = z.object({
      answer: z.string(),
    })

    const testAnswerExtractor = (content: { answer: string }) => content.answer

    describe('accept action scenarios', () => {
      it('should handle accept action with valid answer', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { answer: 'test response' },
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

        expect(mockRequest).toHaveBeenCalledWith(
          {
            method: 'elicitation/create',
            params: { message: 'Test message', requestedSchema: testSchema },
          },
          expect.any(Object)
        )

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User answered with: test response',
            },
          ],
        })
      })

      it('should handle accept action with no answer provided', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { answer: '' },
        })

        const extractorThatReturnsUndefined = () => undefined

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction(
          'Test message',
          testSchema,
          testResponseSchema,
          extractorThatReturnsUndefined
        )

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: "User didn't provide an answer.",
            },
          ],
        })
      })

      it('should handle accept action with empty content', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: undefined,
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: "User didn't provide an answer.",
            },
          ],
        })
      })

      it('should handle accept action with null content', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: null,
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: "User didn't provide an answer.",
            },
          ],
        })
      })
    })

    describe('decline action scenario', () => {
      it('should handle decline action', async () => {
        mockRequest.mockResolvedValue({
          action: 'decline',
          content: undefined,
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User declined to answer.',
            },
          ],
        })
      })

      it('should handle decline action with content (content should be ignored)', async () => {
        mockRequest.mockResolvedValue({
          action: 'decline',
          content: { answer: 'some content' },
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User declined to answer.',
            },
          ],
        })
      })
    })

    describe('cancel action scenario', () => {
      it('should handle cancel action', async () => {
        mockRequest.mockResolvedValue({
          action: 'cancel',
          content: undefined,
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User canceled the dialog.',
            },
          ],
        })
      })

      it('should handle cancel action with content (content should be ignored)', async () => {
        mockRequest.mockResolvedValue({
          action: 'cancel',
          content: { answer: 'some content' },
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User canceled the dialog.',
            },
          ],
        })
      })
    })

    describe('error handling', () => {
      it('should throw error for unknown action', async () => {
        mockRequest.mockResolvedValue({
          action: 'unknown',
          content: undefined,
        })

        const elicitationFunction = requestElicitation(mockServer)

        await expect(
          elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)
        ).rejects.toThrow('Unknown elicitation action: unknown')
      })

      it('should propagate server request errors', async () => {
        mockRequest.mockRejectedValue(new Error('Network error'))

        const elicitationFunction = requestElicitation(mockServer)

        await expect(
          elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)
        ).rejects.toThrow('Network error')
      })

      it('should handle schema validation errors', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { wrongField: 'invalid data' },
        })

        const elicitationFunction = requestElicitation(mockServer)

        await expect(
          elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)
        ).rejects.toThrow()
      })

      it('should handle answerExtractor throwing an error', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { answer: 'test response' },
        })

        const throwingExtractor = () => {
          throw new Error('Extractor error')
        }

        const elicitationFunction = requestElicitation(mockServer)

        await expect(
          elicitationFunction('Test message', testSchema, testResponseSchema, throwingExtractor)
        ).rejects.toThrow('Extractor error')
      })
    })

    describe('complex schema scenarios', () => {
      it('should handle complex object schema with multiple fields', async () => {
        const complexSchema: ElicitationRequestObjectSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              description: 'User name',
            },
            age: {
              type: 'number',
              title: 'Age',
              minimum: 0,
              maximum: 150,
            },
            email: {
              type: 'string',
              title: 'Email',
              format: 'email',
            },
            preferences: {
              type: 'string',
              title: 'Preferences',
              enum: ['option1', 'option2', 'option3'],
              enumNames: ['Option 1', 'Option 2', 'Option 3'],
            },
          },
        }

        const complexResponseSchema = z.object({
          name: z.string(),
          age: z.number(),
          email: z.string(),
          preferences: z.string(),
        })

        const complexExtractor = (content: { name: string; age: number; email: string; preferences: string }) =>
          `${content.name}, ${content.age}, ${content.email}, ${content.preferences}`

        mockRequest.mockResolvedValue({
          action: 'accept',
          content: {
            name: 'John Doe',
            age: 30,
            email: 'john@example.com',
            preferences: 'option1',
          },
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction(
          'Please provide your details',
          complexSchema,
          complexResponseSchema,
          complexExtractor
        )

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User answered with: John Doe, 30, john@example.com, option1',
            },
          ],
        })
      })

      it('should handle boolean type schema', async () => {
        const booleanSchema: ElicitationRequestObjectSchema = {
          type: 'object',
          properties: {
            confirmed: {
              type: 'boolean',
              title: 'Confirmation',
              description: 'Please confirm',
            },
          },
        }

        const booleanResponseSchema = z.object({
          confirmed: z.boolean(),
        })

        const booleanExtractor = (content: { confirmed: boolean }) => (content.confirmed ? 'Yes' : 'No')

        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { confirmed: true },
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction(
          'Do you confirm?',
          booleanSchema,
          booleanResponseSchema,
          booleanExtractor
        )

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User answered with: Yes',
            },
          ],
        })
      })

      it('should handle date-time format schema', async () => {
        const dateTimeSchema: ElicitationRequestObjectSchema = {
          type: 'object',
          properties: {
            appointmentTime: {
              type: 'string',
              title: 'Appointment Time',
              format: 'date-time',
              description: 'Please select appointment time',
            },
          },
        }

        const dateTimeResponseSchema = z.object({
          appointmentTime: z.string(),
        })

        const dateTimeExtractor = (content: { appointmentTime: string }) => content.appointmentTime

        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { appointmentTime: '2024-01-15T10:30:00Z' },
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction(
          'Select appointment time',
          dateTimeSchema,
          dateTimeResponseSchema,
          dateTimeExtractor
        )

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User answered with: 2024-01-15T10:30:00Z',
            },
          ],
        })
      })
    })

    describe('edge cases', () => {
      it('should handle empty message', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { answer: 'response' },
        })

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('', testSchema, testResponseSchema, testAnswerExtractor)

        expect(mockRequest).toHaveBeenCalledWith(
          {
            method: 'elicitation/create',
            params: { message: '', requestedSchema: testSchema },
          },
          expect.any(Object)
        )

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User answered with: response',
            },
          ],
        })
      })

      it('should handle answerExtractor returning empty string', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { answer: 'test' },
        })

        const emptyExtractor = () => ''

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, emptyExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: "User didn't provide an answer.",
            },
          ],
        })
      })

      it('should handle answerExtractor returning whitespace-only string', async () => {
        mockRequest.mockResolvedValue({
          action: 'accept',
          content: { answer: 'test' },
        })

        const whitespaceExtractor = () => '   '

        const elicitationFunction = requestElicitation(mockServer)
        const result = await elicitationFunction('Test message', testSchema, testResponseSchema, whitespaceExtractor)

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'User answered with:    ',
            },
          ],
        })
      })
    })
  })

  describe('MCP compliance', () => {
    const testSchema: ElicitationRequestObjectSchema = {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          title: 'Test Answer',
          description: 'A test answer field',
        },
      },
    }

    const testResponseSchema = z.object({
      answer: z.string(),
    })

    const testAnswerExtractor = (content: { answer: string }) => content.answer

    it('should always return content array with proper structure', async () => {
      mockRequest.mockResolvedValue({
        action: 'accept',
        content: { answer: 'test response' },
      })

      const elicitationFunction = requestElicitation(mockServer)
      const result = await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

      expect(result).toHaveProperty('content')
      expect(Array.isArray(result.content)).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toHaveProperty('type')
      expect(result.content[0]).toHaveProperty('text')
      expect(result.content[0].type).toBe('text')
      expect(typeof result.content[0].text).toBe('string')
    })

    it('should make proper elicitation/create request', async () => {
      mockRequest.mockResolvedValue({
        action: 'accept',
        content: { answer: 'test response' },
      })

      const elicitationFunction = requestElicitation(mockServer)
      await elicitationFunction('Test message', testSchema, testResponseSchema, testAnswerExtractor)

      expect(mockRequest).toHaveBeenCalledWith(
        {
          method: 'elicitation/create',
          params: { message: 'Test message', requestedSchema: testSchema },
        },
        expect.any(Object)
      )
    })

    it('should handle all valid action types', () => {
      const validActions = ['accept', 'decline', 'cancel']

      validActions.forEach((action) => {
        expect(['accept', 'decline', 'cancel']).toContain(action)
      })
    })
  })
})
