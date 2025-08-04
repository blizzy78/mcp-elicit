import type z from 'zod'
import { ELICIT_BOOLEAN, ElicitBooleanArgsSchema, elicitBooleanTool, handleElicitBoolean } from './elicit_boolean.js'
import {
  ELICIT_DATE_TIME,
  ElicitDateTimeArgsSchema,
  elicitDateTimeTool,
  handleElicitDateTime,
} from './elicit_date_time.js'
import { ELICIT_EMAIL, ElicitEmailArgsSchema, elicitEmailTool, handleElicitEmail } from './elicit_email.js'
import {
  ELICIT_INFORMATION,
  ElicitInformationArgsSchema,
  elicitInformationTool,
  handleElicitInformation,
} from './elicit_information.js'
import { ELICIT_NUMBER, ElicitNumberArgsSchema, elicitNumberTool, handleElicitNumber } from './elicit_number.js'
import { ELICIT_OPTIONS, ElicitOptionsArgsSchema, elicitOptionsTool, handleElicitOptions } from './elicit_options.js'
import { ELICIT_URI, ElicitUriArgsSchema, elicitUriTool, handleElicitUri } from './elicit_uri.js'
import type { ToolHandler } from './tools.js'

export const tools = [
  elicitInformationTool,
  elicitOptionsTool,
  elicitBooleanTool,
  elicitNumberTool,
  elicitDateTimeTool,
  elicitEmailTool,
  elicitUriTool,
] as const

export const toolHandlers: Record<string, { handler: ToolHandler; schema: z.ZodTypeAny }> = {
  [ELICIT_INFORMATION]: {
    handler: handleElicitInformation,
    schema: ElicitInformationArgsSchema,
  },

  [ELICIT_OPTIONS]: {
    handler: handleElicitOptions,
    schema: ElicitOptionsArgsSchema,
  },

  [ELICIT_BOOLEAN]: {
    handler: handleElicitBoolean,
    schema: ElicitBooleanArgsSchema,
  },

  [ELICIT_NUMBER]: {
    handler: handleElicitNumber,
    schema: ElicitNumberArgsSchema,
  },

  [ELICIT_DATE_TIME]: {
    handler: handleElicitDateTime,
    schema: ElicitDateTimeArgsSchema,
  },

  [ELICIT_EMAIL]: {
    handler: handleElicitEmail,
    schema: ElicitEmailArgsSchema,
  },

  [ELICIT_URI]: {
    handler: handleElicitUri,
    schema: ElicitUriArgsSchema,
  },
} as const
