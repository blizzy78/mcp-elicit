import { describe, expect, it, vi } from 'vitest'
import { ELICIT_URI, ElicitUriArgsSchema, elicitUriTool, handleElicitUri, type ElicitUriArgs } from './elicit_uri.js'
import type { RequestElicitationFunction } from './elicitation.js'

describe('elicit_uri tests', () => {
  describe('tool workflow simulation', () => {
    it('should handle complete workflow with URI response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://example.com',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Website URL',
        requestedUriDescription: 'Please provide the website URL',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledOnce()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('User answered with: https://example.com')
    })

    it('should handle URI format constraint in schema', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: ftp://files.example.org',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'File server',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'File server',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'string',
              format: 'uri',
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: ftp://files.example.org')
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

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Sensitive URI',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

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

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Optional URI',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

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

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Optional URI input',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('error handling', () => {
    it('should propagate requestElicitation errors', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockRejectedValue(new Error('Network error'))

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Test URI',
      }

      await expect(handleElicitUri(args, mockRequestElicitation)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: null as any,
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Test URI',
      }

      await expect(handleElicitUri(args, mockRequestElicitation)).resolves.toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle various URI schemes', async () => {
      const uriSchemes = [
        'https://example.com/path?query=value#fragment',
        'http://subdomain.example.org:8080/path',
        'ftp://ftp.example.com/files/',
        'file:///home/user/document.txt',
        'mailto:user@example.com',
        'tel:+1-555-123-4567',
        'ssh://user@server.com:22',
        'git://github.com/user/repo.git',
        'ws://websocket.example.com:9000',
        'wss://secure-websocket.example.com',
      ]

      for (const uri of uriSchemes) {
        const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `User answered with: ${uri}`,
            },
          ],
        })

        const args: ElicitUriArgs = {
          requestedUriTitle: 'URI scheme test',
        }

        const result = await handleElicitUri(args, mockRequestElicitation)
        expect(result.content[0].text).toBe(`User answered with: ${uri}`)
      }
    })

    it('should handle URIs with special characters', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://example.com/path%20with%20spaces?param=value%26more',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Encoded URI',
        requestedUriDescription: 'URI with encoded characters',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe(
        'User answered with: https://example.com/path%20with%20spaces?param=value%26more'
      )
    })

    it('should handle international domain names', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://münchen.de/path',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'International domain',
        requestedUriDescription: 'URI with international characters',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: https://münchen.de/path')
    })

    it('should handle special characters in title and description', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://special.example.com',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Special chars: àáâãäåæçèéêë ñ 中文 🚀',
        requestedUriDescription: 'Testing unicode: {"json": true}',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: https://special.example.com')
    })

    it('should handle long titles and descriptions', async () => {
      const longTitle = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://very-long-domain-name.example.com/very/long/path/here',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: longTitle,
        requestedUriDescription: longDescription,
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        longTitle,
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: {
              type: 'string',
              title: longTitle,
              description: longDescription,
              format: 'uri',
            },
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe(
        'User answered with: https://very-long-domain-name.example.com/very/long/path/here'
      )
    })

    it('should handle localhost URIs', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: http://localhost:3000/api/v1',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Local development server',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: http://localhost:3000/api/v1')
    })

    it('should handle IP address URIs', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: http://192.168.1.100:8080/admin',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'IP address URI',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: http://192.168.1.100:8080/admin')
    })

    it('should handle URIs with authentication', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://user:pass@secure.example.com/protected',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Authenticated URI',
        requestedUriDescription: 'URI with embedded credentials',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: https://user:pass@secure.example.com/protected')
    })

    it('should handle complex query parameters', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://api.example.com/search?q=test&limit=10&offset=20&sort=date&order=desc',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'API endpoint',
        requestedUriDescription: 'Full API URL with parameters',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe(
        'User answered with: https://api.example.com/search?q=test&limit=10&offset=20&sort=date&order=desc'
      )
    })

    it('should handle fragment identifiers', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://docs.example.com/guide#section-2',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Documentation link',
        requestedUriDescription: 'Link to specific section',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: https://docs.example.com/guide#section-2')
    })

    it('should handle data URIs', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: data:text/plain;base64,SGVsbG8gV29ybGQ=',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Data URI',
        requestedUriDescription: 'Base64 encoded data',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: data:text/plain;base64,SGVsbG8gV29ybGQ=')
    })
  })

  describe('MCP compliance', () => {
    it('should always return content array with proper structure', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: https://example.com',
          },
        ],
      })

      const args: ElicitUriArgs = {
        requestedUriTitle: 'Test URI',
      }

      const result = await handleElicitUri(args, mockRequestElicitation)

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
        ElicitUriArgsSchema.parse({})
      }).toThrow()

      expect(() => {
        ElicitUriArgsSchema.parse({ requestedUriTitle: '' })
      }).toThrow()

      expect(() => {
        ElicitUriArgsSchema.parse({ requestedUriTitle: 'Valid Title' })
      }).not.toThrow()
    })

    it('should handle optional parameters correctly', () => {
      expect(() => {
        ElicitUriArgsSchema.parse({
          requestedUriTitle: 'Valid Title',
          requestedUriDescription: 'Valid Description',
        })
      }).not.toThrow()

      expect(() => {
        ElicitUriArgsSchema.parse({
          requestedUriTitle: 'Valid Title',
          requestedUriDescription: '',
        })
      }).toThrow()
    })

    it('should verify tool metadata compliance', () => {
      expect(elicitUriTool.name).toBe(ELICIT_URI)
      expect(typeof elicitUriTool.description).toBe('string')
      expect(elicitUriTool.description.length).toBeGreaterThan(0)
      expect(elicitUriTool.inputSchema).toBeDefined()

      const schema = elicitUriTool.inputSchema as any
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.requestedUriTitle).toBeDefined()
    })
  })
})
