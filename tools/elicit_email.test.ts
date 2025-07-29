import { describe, expect, it, vi } from 'vitest'
import {
  ELICIT_EMAIL,
  ElicitEmailArgsSchema,
  elicitEmailTool,
  handleElicitEmail,
  type ElicitEmailArgs,
} from './elicit_email.js'
import type { RequestElicitationFunction } from './elicitation.js'

describe('elicit_email tests', () => {
  describe('tool workflow simulation', () => {
    it('should handle complete workflow with email response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: user@example.com',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Your email address',
        requestedEmailDescription: 'Please provide your primary email address',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledOnce()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('User answered with: user@example.com')
    })

    it('should handle email format constraint in schema', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: test@domain.org',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Contact email',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Contact email',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'string',
              format: 'email',
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: test@domain.org')
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

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Sensitive email',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

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

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Optional email',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

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

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Optional email input',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('error handling', () => {
    it('should propagate requestElicitation errors', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockRejectedValue(new Error('Network error'))

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Test email',
      }

      await expect(handleElicitEmail(args, mockRequestElicitation)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: null as any,
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Test email',
      }

      await expect(handleElicitEmail(args, mockRequestElicitation)).resolves.toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle various valid email formats', async () => {
      const validEmails = [
        'simple@example.com',
        'user+tag@example.org',
        'firstname.lastname@subdomain.example.co.uk',
        'user123@domain-name.net',
        'test_email@example-domain.info',
        'a@b.co',
      ]

      for (const email of validEmails) {
        const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `User answered with: ${email}`,
            },
          ],
        })

        const args: ElicitEmailArgs = {
          requestedEmailTitle: 'Email validation test',
        }

        const result = await handleElicitEmail(args, mockRequestElicitation)
        expect(result.content[0].text).toBe(`User answered with: ${email}`)
      }
    })

    it('should handle international domain names', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: user@münchen.de',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'International email',
        requestedEmailDescription: 'Email with international domain',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: user@münchen.de')
    })

    it('should handle special characters in title and description', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: special@example.com',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Special chars: àáâãäåæçèéêë ñ 中文 🚀',
        requestedEmailDescription: 'Testing unicode: {"json": true}',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: special@example.com')
    })

    it('should handle long titles and descriptions', async () => {
      const longTitle = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: long@example.com',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: longTitle,
        requestedEmailDescription: longDescription,
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        longTitle,
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: {
              type: 'string',
              title: longTitle,
              description: longDescription,
              format: 'email',
            },
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: long@example.com')
    })

    it('should handle business email addresses', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: john.doe@company.com',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Business email',
        requestedEmailDescription: 'Your work email address',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: john.doe@company.com')
    })

    it('should handle emails with numbers', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: user123@test456.com',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Numeric email',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: user123@test456.com')
    })

    it('should handle empty response as no answer', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: "User didn't provide an answer.",
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Empty email test',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('MCP compliance', () => {
    it('should always return content array with proper structure', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: test@example.com',
          },
        ],
      })

      const args: ElicitEmailArgs = {
        requestedEmailTitle: 'Test Email',
      }

      const result = await handleElicitEmail(args, mockRequestElicitation)

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
        ElicitEmailArgsSchema.parse({})
      }).toThrow()

      expect(() => {
        ElicitEmailArgsSchema.parse({ requestedEmailTitle: '' })
      }).toThrow()

      expect(() => {
        ElicitEmailArgsSchema.parse({ requestedEmailTitle: 'Valid Title' })
      }).not.toThrow()
    })

    it('should handle optional parameters correctly', () => {
      expect(() => {
        ElicitEmailArgsSchema.parse({
          requestedEmailTitle: 'Valid Title',
          requestedEmailDescription: 'Valid Description',
        })
      }).not.toThrow()

      expect(() => {
        ElicitEmailArgsSchema.parse({
          requestedEmailTitle: 'Valid Title',
          requestedEmailDescription: '',
        })
      }).toThrow()
    })

    it('should verify tool metadata compliance', () => {
      expect(elicitEmailTool.name).toBe(ELICIT_EMAIL)
      expect(typeof elicitEmailTool.description).toBe('string')
      expect(elicitEmailTool.description.length).toBeGreaterThan(0)
      expect(elicitEmailTool.inputSchema).toBeDefined()

      const schema = elicitEmailTool.inputSchema as any
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.requestedEmailTitle).toBeDefined()
    })
  })
})
