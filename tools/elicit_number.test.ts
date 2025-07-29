import { describe, expect, it, vi } from 'vitest'
import {
  ELICIT_NUMBER,
  ElicitNumberArgsSchema,
  elicitNumberTool,
  handleElicitNumber,
  type ElicitNumberArgs,
} from './elicit_number.js'
import type { RequestElicitationFunction } from './elicitation.js'

describe('elicit_number tests', () => {
  describe('tool workflow simulation', () => {
    it('should handle complete workflow with number response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 42',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Enter your age',
        requestedNumberDescription: 'Please provide your age in years',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledOnce()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('User answered with: 42')
    })

    it('should handle number with minimum constraint', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 10',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Minimum value',
        minimum: 5,
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Minimum value',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'number',
              minimum: 5,
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: 10')
    })

    it('should handle number with maximum constraint', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 8',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Maximum value',
        maximum: 10,
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Maximum value',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'number',
              maximum: 10,
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: 8')
    })

    it('should handle number with both minimum and maximum constraints', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 7',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Range value',
        minimum: 1,
        maximum: 10,
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Range value',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'number',
              minimum: 1,
              maximum: 10,
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: 7')
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

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Sensitive number',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

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

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Optional number',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

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

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Optional number input',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('error handling', () => {
    it('should throw error when minimum is greater than maximum', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn()

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Invalid range',
        minimum: 10,
        maximum: 5,
      }

      await expect(handleElicitNumber(args, mockRequestElicitation)).rejects.toThrow(
        'minimum value must be less than or equal to maximum value'
      )

      expect(mockRequestElicitation).not.toHaveBeenCalled()
    })

    it('should propagate requestElicitation errors', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockRejectedValue(new Error('Network error'))

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Test number',
      }

      await expect(handleElicitNumber(args, mockRequestElicitation)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: null as any,
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Test number',
      }

      await expect(handleElicitNumber(args, mockRequestElicitation)).resolves.toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle decimal numbers', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 3.14159',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Pi approximation',
        requestedNumberDescription: 'Enter the value of pi',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: 3.14159')
    })

    it('should handle negative numbers', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: -273.15',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Temperature',
        requestedNumberDescription: 'Absolute zero in Celsius',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: -273.15')
    })

    it('should handle zero', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 0',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Zero value',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: 0')
    })

    it('should handle special characters in title and description', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 100',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Special chars: àáâãäåæçèéêë ñ 中文 🚀',
        requestedNumberDescription: 'Testing unicode: {"json": true}',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: 100')
    })

    it('should handle long titles and descriptions', async () => {
      const longTitle = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 999',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: longTitle,
        requestedNumberDescription: longDescription,
        minimum: 0,
        maximum: 1000,
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        longTitle,
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: {
              type: 'number',
              title: longTitle,
              description: longDescription,
              minimum: 0,
              maximum: 1000,
            },
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: 999')
    })

    it('should handle edge case where minimum equals maximum', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 5',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Fixed value',
        minimum: 5,
        maximum: 5,
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: 5')
    })
  })

  describe('MCP compliance', () => {
    it('should always return content array with proper structure', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 42',
          },
        ],
      })

      const args: ElicitNumberArgs = {
        requestedNumberTitle: 'Test Number',
      }

      const result = await handleElicitNumber(args, mockRequestElicitation)

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
        ElicitNumberArgsSchema.parse({})
      }).toThrow()

      expect(() => {
        ElicitNumberArgsSchema.parse({ requestedNumberTitle: '' })
      }).toThrow()

      expect(() => {
        ElicitNumberArgsSchema.parse({ requestedNumberTitle: 'Valid Title' })
      }).not.toThrow()
    })

    it('should handle constraint parameters correctly', () => {
      expect(() => {
        ElicitNumberArgsSchema.parse({
          requestedNumberTitle: 'Valid Title',
          minimum: 5,
          maximum: 10,
        })
      }).not.toThrow()

      expect(() => {
        ElicitNumberArgsSchema.parse({
          requestedNumberTitle: 'Valid Title',
          minimum: -5,
        })
      }).not.toThrow()
    })

    it('should verify tool metadata compliance', () => {
      expect(elicitNumberTool.name).toBe(ELICIT_NUMBER)
      expect(typeof elicitNumberTool.description).toBe('string')
      expect(elicitNumberTool.description.length).toBeGreaterThan(0)
      expect(elicitNumberTool.inputSchema).toBeDefined()

      const schema = elicitNumberTool.inputSchema as any
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.requestedNumberTitle).toBeDefined()
    })
  })
})
