import { describe, expect, it, vi } from 'vitest'
import {
  ELICIT_OPTIONS,
  ElicitOptionsArgsSchema,
  elicitOptionsTool,
  handleElicitOptions,
  type ElicitOptionsArgs,
} from './elicit_options.js'
import type { RequestElicitationFunction } from './elicitation.js'

describe('elicit_options tests', () => {
  describe('tool workflow simulation', () => {
    it('should handle complete workflow with option selection', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: option2',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Choose your favorite color',
        requestedInformationDescription: 'Please select one option',
        options: ['red', 'green', 'blue'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledOnce()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('User answered with: option2')
    })

    it('should handle options with custom names', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: value1',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Select priority',
        options: ['value1', 'value2', 'value3'],
        optionNames: ['High Priority', 'Medium Priority', 'Low Priority'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Select priority',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'string',
              enum: ['value1', 'value2', 'value3'],
              enumNames: ['High Priority', 'Medium Priority', 'Low Priority'],
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: value1')
    })

    it('should handle options without custom names', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: apple',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Choose fruit',
        options: ['apple', 'banana', 'orange'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Choose fruit',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'string',
              enum: ['apple', 'banana', 'orange'],
              enumNames: ['apple', 'banana', 'orange'],
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: apple')
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

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Sensitive choice',
        options: ['yes', 'no'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

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

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Optional selection',
        options: ['option1', 'option2'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

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

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Optional choice',
        options: ['a', 'b', 'c'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('error handling', () => {
    it('should throw error when optionNames length does not match options length', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn()

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Mismatched arrays',
        options: ['a', 'b', 'c'],
        optionNames: ['Option A', 'Option B'],
      }

      await expect(handleElicitOptions(args, mockRequestElicitation)).rejects.toThrow(
        'optionNames array must have the same length as options array'
      )

      expect(mockRequestElicitation).not.toHaveBeenCalled()
    })

    it('should propagate requestElicitation errors', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockRejectedValue(new Error('Network error'))

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Test options',
        options: ['test1', 'test2'],
      }

      await expect(handleElicitOptions(args, mockRequestElicitation)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: null as any,
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Test options',
        options: ['test1', 'test2'],
      }

      await expect(handleElicitOptions(args, mockRequestElicitation)).resolves.toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle single option', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: only_option',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Single choice',
        options: ['only_option'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: only_option')
    })

    it('should handle many options', async () => {
      const options = Array.from({ length: 20 }, (_, i) => `option${i + 1}`)
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: option10',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Many choices',
        options,
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: option10')
    })

    it('should handle options with special characters', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: special_option',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Special chars: àáâãäåæçèéêë ñ 中文 🚀',
        requestedInformationDescription: 'Testing unicode: {"json": true}',
        options: ['special_option', 'normal_option'],
        optionNames: ['Special: àáâãäåæçèéêë ñ 中文 🚀', 'Normal Option'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: special_option')
    })

    it('should handle options with JSON-like values', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: {"type": "json"}',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'JSON values',
        options: ['{"type": "json"}', '{"type": "xml"}', '{"type": "yaml"}'],
        optionNames: ['JSON Format', 'XML Format', 'YAML Format'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: {"type": "json"}')
    })

    it('should handle long titles, descriptions, and option names', async () => {
      const longTitle = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)
      const longOptionName = 'C'.repeat(100)

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: long_option',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: longTitle,
        requestedInformationDescription: longDescription,
        options: ['long_option', 'short'],
        optionNames: [longOptionName, 'Short'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        longTitle,
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: {
              type: 'string',
              title: longTitle,
              description: longDescription,
              enum: ['long_option', 'short'],
              enumNames: [longOptionName, 'Short'],
            },
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: long_option')
    })

    it('should handle empty string options', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: ',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Including empty',
        options: ['', 'non-empty'],
        optionNames: ['Empty Option', 'Non-empty Option'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: ')
    })

    it('should handle duplicate option values', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: duplicate',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Duplicate values',
        options: ['duplicate', 'duplicate', 'unique'],
        optionNames: ['First Duplicate', 'Second Duplicate', 'Unique Option'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: duplicate')
    })
  })

  describe('MCP compliance', () => {
    it('should always return content array with proper structure', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: option1',
          },
        ],
      })

      const args: ElicitOptionsArgs = {
        requestedInformationTitle: 'Test Options',
        options: ['option1', 'option2'],
      }

      const result = await handleElicitOptions(args, mockRequestElicitation)

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
        ElicitOptionsArgsSchema.parse({})
      }).toThrow()

      expect(() => {
        ElicitOptionsArgsSchema.parse({ requestedInformationTitle: '' })
      }).toThrow()

      expect(() => {
        ElicitOptionsArgsSchema.parse({
          requestedInformationTitle: 'Valid Title',
          options: [],
        })
      }).toThrow()

      expect(() => {
        ElicitOptionsArgsSchema.parse({
          requestedInformationTitle: 'Valid Title',
          options: ['option1', 'option2'],
        })
      }).not.toThrow()
    })

    it('should handle optional parameters correctly', () => {
      expect(() => {
        ElicitOptionsArgsSchema.parse({
          requestedInformationTitle: 'Valid Title',
          options: ['option1', 'option2'],
          optionNames: ['Name 1', 'Name 2'],
          requestedInformationDescription: 'Valid Description',
        })
      }).not.toThrow()

      expect(() => {
        ElicitOptionsArgsSchema.parse({
          requestedInformationTitle: 'Valid Title',
          options: ['option1', 'option2'],
          requestedInformationDescription: '',
        })
      }).toThrow()
    })

    it('should verify tool metadata compliance', () => {
      expect(elicitOptionsTool.name).toBe(ELICIT_OPTIONS)
      expect(typeof elicitOptionsTool.description).toBe('string')
      expect(elicitOptionsTool.description.length).toBeGreaterThan(0)
      expect(elicitOptionsTool.inputSchema).toBeDefined()

      const schema = elicitOptionsTool.inputSchema as any
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.requestedInformationTitle).toBeDefined()
      expect(schema.properties.options).toBeDefined()
    })
  })
})
