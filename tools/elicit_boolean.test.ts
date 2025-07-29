import { describe, expect, it, vi } from 'vitest'
import {
  ELICIT_BOOLEAN,
  ElicitBooleanArgsSchema,
  elicitBooleanTool,
  handleElicitBoolean,
  type ElicitBooleanArgs,
} from './elicit_boolean.js'
import type { RequestElicitationFunction } from './elicitation.js'

describe('elicit_boolean tests', () => {
  describe('tool workflow simulation', () => {
    it('should handle complete workflow with true response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: true',
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: 'Do you want to continue?',
        questionDescription: 'This will proceed with the next step',
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledOnce()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('User answered with: true')
    })

    it('should handle complete workflow with false response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: false',
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: 'Are you sure?',
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe('User answered with: false')
    })

    it('should handle user decline response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User declined to answer.',
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: 'Is this confidential?',
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe('User declined to answer.')
    })

    it('should handle user cancel response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User canceled the dialog.',
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: 'Enable notifications?',
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe('User canceled the dialog.')
    })

    it('should handle no answer provided', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: "User didn't provide an answer.",
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: 'Optional setting?',
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('error handling', () => {
    it('should propagate requestElicitation errors', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockRejectedValue(new Error('Network error'))

      const args: ElicitBooleanArgs = {
        question: 'Test question?',
      }

      await expect(handleElicitBoolean(args, mockRequestElicitation)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: null as any,
      })

      const args: ElicitBooleanArgs = {
        question: 'Test question?',
      }

      await expect(handleElicitBoolean(args, mockRequestElicitation)).resolves.toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle questions with special characters', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: true',
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: 'Is your name "José"?',
        questionDescription: 'Testing special chars: àáâãäåæçèéêë ñ 中文 🚀',
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: true')
    })

    it('should handle long questions and descriptions', async () => {
      const longQuestion = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: false',
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: longQuestion,
        questionDescription: longDescription,
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        longQuestion,
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: {
              type: 'boolean',
              title: longQuestion,
              description: longDescription,
            },
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: false')
    })

    it('should handle various boolean value responses', async () => {
      const testCases = [
        { input: true, expected: 'true' },
        { input: false, expected: 'false' },
      ]

      for (const testCase of testCases) {
        const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `User answered with: ${testCase.expected}`,
            },
          ],
        })

        const args: ElicitBooleanArgs = {
          question: 'Test question?',
        }

        const result = await handleElicitBoolean(args, mockRequestElicitation)
        expect(result.content[0].text).toBe(`User answered with: ${testCase.expected}`)
      }
    })
  })

  describe('MCP compliance', () => {
    it('should always return content array with proper structure', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: true',
          },
        ],
      })

      const args: ElicitBooleanArgs = {
        question: 'Test Question?',
      }

      const result = await handleElicitBoolean(args, mockRequestElicitation)

      expect(result).toHaveProperty('content')
      expect(Array.isArray(result.content)).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toHaveProperty('type')
      expect(result.content[0]).toHaveProperty('text')
      expect(result.content[0].type).toBe('text')
      expect(typeof result.content[0].text).toBe('string')
    })

    it('should validate required parameters', () => {
      expect(() => {
        ElicitBooleanArgsSchema.parse({})
      }).toThrow()

      expect(() => {
        ElicitBooleanArgsSchema.parse({ question: '' })
      }).toThrow()

      expect(() => {
        ElicitBooleanArgsSchema.parse({ question: 'Valid question?' })
      }).not.toThrow()
    })

    it('should handle optional parameters correctly', () => {
      expect(() => {
        ElicitBooleanArgsSchema.parse({
          question: 'Valid question?',
          questionDescription: 'Valid description',
        })
      }).not.toThrow()

      expect(() => {
        ElicitBooleanArgsSchema.parse({
          question: 'Valid question?',
          questionDescription: '',
        })
      }).toThrow()
    })

    it('should verify tool metadata compliance', () => {
      expect(elicitBooleanTool.name).toBe(ELICIT_BOOLEAN)
      expect(typeof elicitBooleanTool.description).toBe('string')
      expect(elicitBooleanTool.description.length).toBeGreaterThan(0)
      expect(elicitBooleanTool.inputSchema).toBeDefined()

      const schema = elicitBooleanTool.inputSchema as any
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.question).toBeDefined()
    })
  })
})
