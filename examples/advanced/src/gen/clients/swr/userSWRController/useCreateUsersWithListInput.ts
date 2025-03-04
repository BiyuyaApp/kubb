import client from '../../../../swr-client.ts'
import useSWRMutation from 'swr/mutation'
import type { RequestConfig } from '../../../../swr-client.ts'
import type {
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUsersWithListInputMutationResponseSchema } from '../../../zod/userController/createUsersWithListInputSchema.ts'

export const createUsersWithListInputMutationKey = () => [{ url: '/user/createWithList' }] as const

export type CreateUsersWithListInputMutationKey = ReturnType<typeof createUsersWithListInputMutationKey>

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
async function createUsersWithListInput(
  data?: CreateUsersWithListInputMutationRequest,
  config: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>> = {},
) {
  const res = await client<CreateUsersWithListInputMutationResponse, Error, CreateUsersWithListInputMutationRequest>({
    method: 'POST',
    url: '/user/createWithList',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    data,
    ...config,
  })
  return createUsersWithListInputMutationResponseSchema.parse(res.data)
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * @link /user/createWithList
 */
export function useCreateUsersWithListInput(
  options: {
    mutation?: Parameters<
      typeof useSWRMutation<CreateUsersWithListInputMutationResponse, Error, CreateUsersWithListInputMutationKey, CreateUsersWithListInputMutationRequest>
    >[2]
    client?: Partial<RequestConfig<CreateUsersWithListInputMutationRequest>>
    shouldFetch?: boolean
  } = {},
) {
  const { mutation: mutationOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const mutationKey = createUsersWithListInputMutationKey()
  return useSWRMutation<CreateUsersWithListInputMutationResponse, Error, CreateUsersWithListInputMutationKey | null, CreateUsersWithListInputMutationRequest>(
    shouldFetch ? mutationKey : null,
    async (_url, { arg: data }) => {
      return createUsersWithListInput(data, config)
    },
    mutationOptions,
  )
}
