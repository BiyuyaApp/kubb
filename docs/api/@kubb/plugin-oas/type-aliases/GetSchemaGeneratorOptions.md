[API](../../../packages.md) / [@kubb/plugin-oas](../index.md) / GetSchemaGeneratorOptions

# GetSchemaGeneratorOptions\<T\>

```ts
type GetSchemaGeneratorOptions<T>: T extends SchemaGenerator<infer Options, any, any> ? Options : never;
```

## Type Parameters

• **T** *extends* [`SchemaGenerator`](../classes/SchemaGenerator.md)\<`any`, `any`, `any`\>

## Defined in

[plugin-oas/src/SchemaGenerator.ts:19](https://github.com/kubb-project/kubb/blob/dcebbafbee668a7722775212bce85eec29e39573/packages/plugin-oas/src/SchemaGenerator.ts#L19)
