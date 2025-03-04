import client from '../../../../swr-client.ts'
import useSWR from 'swr'
import type { RequestConfig } from '../../../../swr-client.ts'
import type { LoginUserQueryResponse, LoginUserQueryParams, LoginUser400 } from '../../../models/ts/userController/LoginUser.ts'
import { loginUserQueryResponseSchema } from '../../../zod/userController/loginUserSchema.ts'

export const loginUserQueryKey = (params?: LoginUserQueryParams) => [{ url: '/user/login' }, ...(params ? [params] : [])] as const

export type LoginUserQueryKey = ReturnType<typeof loginUserQueryKey>

/**
 * @summary Logs user into the system
 * @link /user/login
 */
async function loginUser(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  const res = await client<LoginUserQueryResponse, LoginUser400, unknown>({
    method: 'GET',
    url: '/user/login',
    baseURL: 'https://petstore3.swagger.io/api/v3',
    params,
    ...config,
  })
  return loginUserQueryResponseSchema.parse(res.data)
}

export function loginUserQueryOptions(params?: LoginUserQueryParams, config: Partial<RequestConfig> = {}) {
  return {
    fetcher: async () => {
      return loginUser(params, config)
    },
  }
}

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export function useLoginUser(
  params?: LoginUserQueryParams,
  options: {
    query?: Parameters<typeof useSWR<LoginUserQueryResponse, LoginUser400, LoginUserQueryKey | null, any>>[2]
    client?: Partial<RequestConfig>
    shouldFetch?: boolean
  } = {},
) {
  const { query: queryOptions, client: config = {}, shouldFetch = true } = options ?? {}
  const queryKey = loginUserQueryKey(params)
  return useSWR<LoginUserQueryResponse, LoginUser400, LoginUserQueryKey | null>(shouldFetch ? queryKey : null, {
    ...loginUserQueryOptions(params, config),
    ...queryOptions,
  })
}
