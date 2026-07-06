import { type McpConfig } from "./config.js"

export type ApiClient = {
  getJson: (path: string) => Promise<unknown>
}

export class ApiResponseError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Plyco API returned status ${status}`)
    this.name = "ApiResponseError"
  }
}

export function createApiClient(
  config: McpConfig,
  fetchFn: typeof fetch = fetch,
): ApiClient {
  return {
    async getJson(path: string) {
      const response = await fetchFn(new URL(path, config.apiUrl), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
        },
      })
      const body = await readJsonResponse(response)

      if (!response.ok) {
        throw new ApiResponseError(response.status, body)
      }

      return body
    },
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(
      `Plyco API returned a non-JSON response with status ${response.status}: ${text.slice(0, 500)}`,
    )
  }
}
