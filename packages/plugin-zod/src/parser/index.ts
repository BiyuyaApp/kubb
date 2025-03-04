import transformers, { createJSDocBlockText } from '@kubb/core/transformers'
import { type SchemaKeywordMapper, isKeyword, schemaKeywords } from '@kubb/plugin-oas'

import type { Schema, SchemaKeywordBase, SchemaMapper } from '@kubb/plugin-oas'

const zodKeywordMapper = {
  any: () => 'z.any()',
  unknown: () => 'z.unknown()',
  number: (coercion?: boolean, min?: number, max?: number) => {
    return [coercion ? 'z.coerce.number()' : 'z.number()', min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined]
      .filter(Boolean)
      .join('')
  },
  integer: (coercion?: boolean, min?: number, max?: number) => {
    return [
      coercion ? 'z.coerce.number().int()' : 'z.number().int()',
      min !== undefined ? `.min(${min})` : undefined,
      max !== undefined ? `.max(${max})` : undefined,
    ]
      .filter(Boolean)
      .join('')
  },
  object: (value?: string) => `z.object({${value}})`,
  string: (coercion?: boolean, min?: number, max?: number) => {
    return [coercion ? 'z.coerce.string()' : 'z.string()', min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined]
      .filter(Boolean)
      .join('')
  },
  boolean: () => 'z.boolean()',
  undefined: () => 'z.undefined()',
  nullable: () => '.nullable()',
  null: () => 'z.null()',
  nullish: () => '.nullish()',
  array: (items: string[] = [], min?: number, max?: number) => {
    return [`z.array(${items?.join('')})`, min !== undefined ? `.min(${min})` : undefined, max !== undefined ? `.max(${max})` : undefined]
      .filter(Boolean)
      .join('')
  },
  tuple: (items: string[] = []) => `z.tuple([${items?.join(', ')}])`,
  enum: (items: string[] = []) => `z.enum([${items?.join(', ')}])`,
  union: (items: string[] = []) => `z.union([${items?.join(', ')}])`,
  const: (value?: string | number | boolean) => `z.literal(${value ?? ''})`,
  /**
   * ISO 8601
   */
  datetime: (offset = false, local = false) => {
    if (offset) {
      return `z.string().datetime({ offset: ${offset} })`
    }

    if (local) {
      return `z.string().datetime({ local: ${local} })`
    }

    return 'z.string().datetime()'
  },
  /**
   * Type `'date'` Date
   * Type `'string'` ISO date format (YYYY-MM-DD)
   * @default ISO date format (YYYY-MM-DD)
   */
  date: (type: 'date' | 'string' = 'string', coercion?: boolean) => {
    if (type === 'string') {
      return 'z.string().date()'
    }

    if (coercion) {
      return 'z.coerce.date()'
    }

    return 'z.date()'
  },
  /**
   * Type `'date'` Date
   * Type `'string'` ISO time format (HH:mm:ss[.SSSSSS])
   * @default ISO time format (HH:mm:ss[.SSSSSS])
   */
  time: (type: 'date' | 'string' = 'string', coercion?: boolean) => {
    if (type === 'string') {
      return 'z.string().time()'
    }

    if (coercion) {
      return 'z.coerce.date()'
    }

    return 'z.date()'
  },
  uuid: () => '.uuid()',
  url: () => '.url()',
  strict: () => '.strict()',
  default: (value?: string | number | true) => `.default(${value ?? ''})`,
  and: (items: string[] = []) => items?.map((item) => `.and(${item})`).join(''),
  describe: (value = '') => `.describe(${value})`,
  min: (value?: number) => `.min(${value ?? ''})`,
  max: (value?: number) => `.max(${value ?? ''})`,
  optional: () => '.optional()',
  matches: (value = '') => `.regex(${value})`,
  email: () => '.email()',
  firstName: undefined,
  lastName: undefined,
  password: undefined,
  phone: undefined,
  readOnly: undefined,
  writeOnly: undefined,
  ref: (value?: string) => (value ? `z.lazy(() => ${value})` : undefined),
  blob: () => 'z.string()',
  deprecated: undefined,
  example: undefined,
  schema: undefined,
  catchall: (value?: string) => (value ? `.catchall(${value})` : undefined),
  name: undefined,
} satisfies SchemaMapper<string | null | undefined>

/**
 * @link based on https://github.com/cellular/oazapfts/blob/7ba226ebb15374e8483cc53e7532f1663179a22c/src/codegen/generate.ts#L398
 */

export function sort(items?: Schema[]): Schema[] {
  const order: string[] = [
    schemaKeywords.string,
    schemaKeywords.datetime,
    schemaKeywords.date,
    schemaKeywords.time,
    schemaKeywords.tuple,
    schemaKeywords.number,
    schemaKeywords.object,
    schemaKeywords.enum,
    schemaKeywords.url,
    schemaKeywords.email,
    schemaKeywords.firstName,
    schemaKeywords.lastName,
    schemaKeywords.password,
    schemaKeywords.matches,
    schemaKeywords.uuid,
    schemaKeywords.min,
    schemaKeywords.max,
    schemaKeywords.default,
    schemaKeywords.describe,
    schemaKeywords.optional,
    schemaKeywords.nullable,
    schemaKeywords.nullish,
    schemaKeywords.null,
  ]

  if (!items) {
    return []
  }

  return transformers.orderBy(items, [(v) => order.indexOf(v.keyword)], ['asc'])
}

type ParserOptions = {
  name: string
  typeName?: string
  description?: string

  keysToOmit?: string[]
  mapper?: Record<string, string>
  coercion?: boolean
}

export function parse(parent: Schema | undefined, current: Schema, options: ParserOptions): string | undefined {
  const value = zodKeywordMapper[current.keyword as keyof typeof zodKeywordMapper]

  if (!value) {
    return undefined
  }

  if (isKeyword(current, schemaKeywords.union)) {
    // zod union type needs at least 2 items
    if (Array.isArray(current.args) && current.args.length === 1) {
      return parse(parent, current.args[0] as Schema, options)
    }
    if (Array.isArray(current.args) && !current.args.length) {
      return ''
    }

    return zodKeywordMapper.union(
      sort(current.args)
        .map((schema) => parse(current, schema, options))
        .filter(Boolean),
    )
  }

  if (isKeyword(current, schemaKeywords.and)) {
    const items = sort(current.args)
      .filter((schema: Schema) => {
        return ![schemaKeywords.optional, schemaKeywords.describe].includes(schema.keyword as typeof schemaKeywords.describe)
      })
      .map((schema: Schema) => parse(current, schema, options))
      .filter(Boolean)

    return `${items.slice(0, 1)}${zodKeywordMapper.and(items.slice(1))}`
  }

  if (isKeyword(current, schemaKeywords.array)) {
    return zodKeywordMapper.array(
      sort(current.args.items)
        .map((schemas) => parse(current, schemas, options))
        .filter(Boolean),
      current.args.min,
      current.args.max,
    )
  }

  if (isKeyword(current, schemaKeywords.enum)) {
    if (current.args.asConst) {
      if (current.args.items.length === 1) {
        return parse(
          current,
          {
            keyword: schemaKeywords.const,
            args: current.args.items[0],
          },
          options,
        )
      }

      return zodKeywordMapper.union(
        current.args.items
          .map((schema) => {
            return parse(
              current,
              {
                keyword: schemaKeywords.const,
                args: schema,
              },
              options,
            )
          })
          .filter(Boolean),
      )
    }

    return zodKeywordMapper.enum(
      current.args.items.map((schema) => {
        if (schema.format === 'boolean') {
          return transformers.stringify(schema.value)
        }

        if (schema.format === 'number') {
          return transformers.stringify(schema.value)
        }
        return transformers.stringify(schema.value)
      }),
    )
  }

  if (isKeyword(current, schemaKeywords.ref)) {
    return zodKeywordMapper.ref(current.args?.name)
  }

  if (isKeyword(current, schemaKeywords.object)) {
    const properties = Object.entries(current.args?.properties || {})
      .filter((item) => {
        const schema = item[1]
        return schema && typeof schema.map === 'function'
      })
      .map(([name, schemas]) => {
        const nameSchema = schemas.find((schema) => schema.keyword === schemaKeywords.name) as SchemaKeywordMapper['name']
        const mappedName = nameSchema?.args || name

        // custom mapper(pluginOptions)
        if (options.mapper?.[mappedName]) {
          return `"${name}": ${options.mapper?.[mappedName]}`
        }

        return `"${name}": ${sort(schemas)
          .map((schema, array) => {
            return parse(current, schema, options)
          })
          .filter(Boolean)
          .join('')}`
      })
      .join(',')

    const additionalProperties = current.args?.additionalProperties?.length
      ? current.args.additionalProperties
          .map((schema) => parse(current, schema, options))
          .filter(Boolean)
          .join('')
      : undefined

    const text = [
      zodKeywordMapper.object(properties),
      current.args?.strict ? zodKeywordMapper.strict() : undefined,
      additionalProperties ? zodKeywordMapper.catchall(additionalProperties) : undefined,
    ].filter(Boolean)

    return text.join('')
  }

  if (isKeyword(current, schemaKeywords.tuple)) {
    return zodKeywordMapper.tuple(current.args.items.map((schema) => parse(current, schema, options)).filter(Boolean))
  }

  if (isKeyword(current, schemaKeywords.const)) {
    if (current.args.format === 'number' && current.args.value !== undefined) {
      return zodKeywordMapper.const(Number.parseInt(current.args.value?.toString()))
    }

    if (current.args.format === 'boolean' && current.args.value !== undefined) {
      return zodKeywordMapper.const(current.args.value)
    }
    return zodKeywordMapper.const(transformers.stringify(current.args.value))
  }

  if (isKeyword(current, schemaKeywords.matches)) {
    if (current.args) {
      return zodKeywordMapper.matches(transformers.toRegExpString(current.args))
    }
  }

  if (isKeyword(current, schemaKeywords.default)) {
    if (current.args) {
      return zodKeywordMapper.default(current.args)
    }
  }

  if (isKeyword(current, schemaKeywords.describe)) {
    if (current.args) {
      return zodKeywordMapper.describe(transformers.stringify(current.args.toString()))
    }
  }

  if (isKeyword(current, schemaKeywords.string)) {
    return zodKeywordMapper.string(options.coercion)
  }

  if (isKeyword(current, schemaKeywords.number)) {
    return zodKeywordMapper.number(options.coercion)
  }

  if (isKeyword(current, schemaKeywords.integer)) {
    return zodKeywordMapper.integer(options.coercion)
  }

  if (isKeyword(current, schemaKeywords.min)) {
    return zodKeywordMapper.min(current.args)
  }
  if (isKeyword(current, schemaKeywords.max)) {
    return zodKeywordMapper.max(current.args)
  }

  if (isKeyword(current, schemaKeywords.datetime)) {
    return zodKeywordMapper.datetime(current.args.offset, current.args.local)
  }

  if (isKeyword(current, schemaKeywords.date)) {
    return zodKeywordMapper.date(current.args.type, options.coercion)
  }

  if (isKeyword(current, schemaKeywords.time)) {
    return zodKeywordMapper.time(current.args.type, options.coercion)
  }

  if (current.keyword in zodKeywordMapper && 'args' in current) {
    const value = zodKeywordMapper[current.keyword as keyof typeof zodKeywordMapper] as (typeof zodKeywordMapper)['const']

    return value((current as SchemaKeywordBase<unknown>).args as any)
  }

  if (current.keyword in zodKeywordMapper) {
    return value()
  }

  return undefined
}
