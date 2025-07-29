import { describe, expect, it, vi } from 'vitest'
import {
  ELICIT_INFORMATION,
  ElicitInformationArgsSchema,
  elicitInformationTool,
  handleElicitInformation,
  type ElicitInformationArgs,
} from './elicit_information.js'
import type { RequestElicitationFunction } from './elicitation.js'

describe('elicit_information tests', () => {
  describe('tool workflow simulation', () => {
    it('should handle complete workflow with accept response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: My detailed response',
          },
        ],
      })

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Project Requirements',
        requestedInformationDescription: 'Please describe the project requirements in detail',
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledOnce()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('User answered with: My detailed response')
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

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Sensitive Information',
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

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

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Feedback',
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

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

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Optional Information',
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('error handling', () => {
    it('should propagate requestElicitation errors', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockRejectedValue(new Error('Network error'))

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Test Title',
      }

      await expect(handleElicitInformation(args, mockRequestElicitation)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: null as any,
      })

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Test Title',
      }

      // Should not throw, but should handle the malformed response
      await expect(handleElicitInformation(args, mockRequestElicitation)).resolves.toBeDefined()
    })
  })

  describe('MCP compliance', () => {
    it('should always return content array with proper structure', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: test response',
          },
        ],
      })

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Test Title',
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

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
        ElicitInformationArgsSchema.parse({})
      }).toThrow()

      expect(() => {
        ElicitInformationArgsSchema.parse({ requestedInformationTitle: '' })
      }).toThrow()

      expect(() => {
        ElicitInformationArgsSchema.parse({ requestedInformationTitle: 'Valid Title' })
      }).not.toThrow()
    })

    it('should handle optional parameters correctly', () => {
      expect(() => {
        ElicitInformationArgsSchema.parse({
          requestedInformationTitle: 'Valid Title',
          requestedInformationDescription: 'Valid Description',
        })
      }).not.toThrow()

      expect(() => {
        ElicitInformationArgsSchema.parse({
          requestedInformationTitle: 'Valid Title',
          requestedInformationDescription: '',
        })
      }).toThrow()
    })

    it('should verify tool metadata compliance', () => {
      expect(elicitInformationTool.name).toBe(ELICIT_INFORMATION)
      expect(typeof elicitInformationTool.description).toBe('string')
      expect(elicitInformationTool.description.length).toBeGreaterThan(0)
      expect(elicitInformationTool.inputSchema).toBeDefined()

      const schema = elicitInformationTool.inputSchema as any
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.requestedInformationTitle).toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle multi-line responses', async () => {
      const multiLineResponse = `Line 1
Line 2
Line 3`

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: `User answered with: ${multiLineResponse}`,
          },
        ],
      })

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Multi-line Input',
        requestedInformationDescription: 'Please provide multiple lines of text',
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

      expect(result.content[0].text).toContain(multiLineResponse)
    })

    it('should handle special characters in responses', async () => {
      const specialCharsResponse = 'Special chars: àáâãäåæçèéêë ñ 中文 🚀 {"json": true}'

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: `User answered with: ${specialCharsResponse}`,
          },
        ],
      })

      const args: ElicitInformationArgs = {
        requestedInformationTitle: 'Unicode Test',
        requestedInformationDescription: 'Test with special characters',
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

      expect(result.content[0].text).toContain(specialCharsResponse)
    })

    it('should handle long titles and descriptions', async () => {
      const longTitle = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: Response to long prompt',
          },
        ],
      })

      const args: ElicitInformationArgs = {
        requestedInformationTitle: longTitle,
        requestedInformationDescription: longDescription,
      }

      const result = await handleElicitInformation(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        longTitle,
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: {
              type: 'string',
              title: longTitle,
              description: longDescription,
            },
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: Response to long prompt')
    })
  })
})
