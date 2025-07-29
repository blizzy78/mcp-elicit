import { describe, expect, it, vi } from 'vitest'
import {
  ELICIT_DATE_TIME,
  ElicitDateTimeArgsSchema,
  elicitDateTimeTool,
  handleElicitDateTime,
  type ElicitDateTimeArgs,
} from './elicit_date_time.js'
import type { RequestElicitationFunction } from './elicitation.js'

describe('elicit_date_time tests', () => {
  describe('tool workflow simulation', () => {
    it('should handle complete workflow with date response', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 2024-03-15',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Your birthday',
        requestedDateTimeDescription: 'Please provide your date of birth',
        format: 'date',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledOnce()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('User answered with: 2024-03-15')
    })

    it('should handle date-time format', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 2024-03-15T14:30:00Z',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Meeting time',
        format: 'date-time',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Meeting time',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'string',
              format: 'date-time',
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: 2024-03-15T14:30:00Z')
    })

    it('should handle default date format', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 2024-12-25',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Default format test',
        format: 'date',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        'Default format test',
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: expect.objectContaining({
              type: 'string',
              format: 'date',
            }),
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: 2024-12-25')
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

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Sensitive date',
        format: 'date',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

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

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Optional date',
        format: 'date-time',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

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

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Optional date input',
        format: 'date',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(result.content).toHaveLength(1)
      expect(result.content[0].text).toBe("User didn't provide an answer.")
    })
  })

  describe('error handling', () => {
    it('should propagate requestElicitation errors', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockRejectedValue(new Error('Network error'))

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Test date',
        format: 'date',
      }

      await expect(handleElicitDateTime(args, mockRequestElicitation)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses gracefully', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: null as any,
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Test date',
        format: 'date',
      }

      await expect(handleElicitDateTime(args, mockRequestElicitation)).resolves.toBeDefined()
    })
  })

  describe('real-world scenarios', () => {
    it('should handle various date formats for date-only', async () => {
      const testDates = [
        '2024-01-01',
        '2024-12-31',
        '2000-02-29', // leap year
        '1999-12-31', // Y2K
      ]

      for (const date of testDates) {
        const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `User answered with: ${date}`,
            },
          ],
        })

        const args: ElicitDateTimeArgs = {
          requestedDateTimeTitle: 'Date test',
          format: 'date',
        }

        const result = await handleElicitDateTime(args, mockRequestElicitation)
        expect(result.content[0].text).toBe(`User answered with: ${date}`)
      }
    })

    it('should handle various date-time formats', async () => {
      const testDateTimes = [
        '2024-03-15T14:30:00Z',
        '2024-03-15T14:30:00.000Z',
        '2024-03-15T14:30:00+02:00',
        '2024-03-15T09:00:00-05:00',
        '2024-12-31T23:59:59Z',
      ]

      for (const dateTime of testDateTimes) {
        const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `User answered with: ${dateTime}`,
            },
          ],
        })

        const args: ElicitDateTimeArgs = {
          requestedDateTimeTitle: 'DateTime test',
          format: 'date-time',
        }

        const result = await handleElicitDateTime(args, mockRequestElicitation)
        expect(result.content[0].text).toBe(`User answered with: ${dateTime}`)
      }
    })

    it('should handle special characters in title and description', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 2024-03-15',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Special chars: àáâãäåæçèéêë ñ 中文 🚀',
        requestedDateTimeDescription: 'Testing unicode: {"json": true}',
        format: 'date',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: 2024-03-15')
    })

    it('should handle long titles and descriptions', async () => {
      const longTitle = 'A'.repeat(200)
      const longDescription = 'B'.repeat(500)

      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 2024-06-01T12:00:00Z',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: longTitle,
        requestedDateTimeDescription: longDescription,
        format: 'date-time',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(mockRequestElicitation).toHaveBeenCalledWith(
        longTitle,
        expect.objectContaining({
          type: 'object',
          properties: {
            answer: {
              type: 'string',
              title: longTitle,
              description: longDescription,
              format: 'date-time',
            },
          },
        }),
        expect.any(Object),
        expect.any(Function)
      )

      expect(result.content[0].text).toBe('User answered with: 2024-06-01T12:00:00Z')
    })

    it('should handle historical dates', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 1969-07-20',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Moon landing date',
        requestedDateTimeDescription: 'When did humans first land on the moon?',
        format: 'date',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: 1969-07-20')
    })

    it('should handle future dates', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 2030-01-01T00:00:00Z',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Future deadline',
        format: 'date-time',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

      expect(result.content[0].text).toBe('User answered with: 2030-01-01T00:00:00Z')
    })

    it('should handle edge case dates', async () => {
      const edgeCases = [
        '2000-02-29', // leap year
        '1900-01-01', // not a leap year (divisible by 100 but not 400)
        '2400-02-29', // leap year (divisible by 400)
      ]

      for (const date of edgeCases) {
        const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `User answered with: ${date}`,
            },
          ],
        })

        const args: ElicitDateTimeArgs = {
          requestedDateTimeTitle: 'Edge case date',
          format: 'date',
        }

        const result = await handleElicitDateTime(args, mockRequestElicitation)
        expect(result.content[0].text).toBe(`User answered with: ${date}`)
      }
    })

    it('should handle midnight and end of day times', async () => {
      const timeCases = [
        '2024-01-01T00:00:00Z', // midnight UTC
        '2024-01-01T23:59:59Z', // end of day UTC
        '2024-06-15T12:00:00Z', // noon UTC
      ]

      for (const dateTime of timeCases) {
        const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `User answered with: ${dateTime}`,
            },
          ],
        })

        const args: ElicitDateTimeArgs = {
          requestedDateTimeTitle: 'Time edge case',
          format: 'date-time',
        }

        const result = await handleElicitDateTime(args, mockRequestElicitation)
        expect(result.content[0].text).toBe(`User answered with: ${dateTime}`)
      }
    })
  })

  describe('MCP compliance', () => {
    it('should always return content array with proper structure', async () => {
      const mockRequestElicitation: RequestElicitationFunction = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'User answered with: 2024-03-15',
          },
        ],
      })

      const args: ElicitDateTimeArgs = {
        requestedDateTimeTitle: 'Test Date',
        format: 'date',
      }

      const result = await handleElicitDateTime(args, mockRequestElicitation)

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
        ElicitDateTimeArgsSchema.parse({})
      }).toThrow()

      expect(() => {
        ElicitDateTimeArgsSchema.parse({ requestedDateTimeTitle: '' })
      }).toThrow()

      expect(() => {
        ElicitDateTimeArgsSchema.parse({
          requestedDateTimeTitle: 'Valid Title',
          format: 'date',
        })
      }).not.toThrow()
    })

    it('should validate format parameter', () => {
      expect(() => {
        ElicitDateTimeArgsSchema.parse({
          requestedDateTimeTitle: 'Valid Title',
          format: 'invalid-format' as any,
        })
      }).toThrow()

      expect(() => {
        ElicitDateTimeArgsSchema.parse({
          requestedDateTimeTitle: 'Valid Title',
          format: 'date-time',
        })
      }).not.toThrow()
    })

    it('should handle optional parameters correctly', () => {
      expect(() => {
        ElicitDateTimeArgsSchema.parse({
          requestedDateTimeTitle: 'Valid Title',
          format: 'date',
          requestedDateTimeDescription: 'Valid Description',
        })
      }).not.toThrow()

      expect(() => {
        ElicitDateTimeArgsSchema.parse({
          requestedDateTimeTitle: 'Valid Title',
          format: 'date',
          requestedDateTimeDescription: '',
        })
      }).toThrow()
    })

    it('should verify tool metadata compliance', () => {
      expect(elicitDateTimeTool.name).toBe(ELICIT_DATE_TIME)
      expect(typeof elicitDateTimeTool.description).toBe('string')
      expect(elicitDateTimeTool.description.length).toBeGreaterThan(0)
      expect(elicitDateTimeTool.inputSchema).toBeDefined()

      const schema = elicitDateTimeTool.inputSchema as any
      expect(schema.type).toBe('object')
      expect(schema.properties).toBeDefined()
      expect(schema.properties.requestedDateTimeTitle).toBeDefined()
      expect(schema.properties.format).toBeDefined()
    })
  })
})
