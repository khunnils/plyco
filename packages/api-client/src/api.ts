import { type OrgClientConfig } from "./config.js"

export type FetchJsonClient = {
  getJson: (path: string) => Promise<unknown>
  sendJson: (
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
  ) => Promise<unknown>
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

export function createFetchJsonClient(
  config: Pick<OrgClientConfig, "apiUrl" | "apiKey">,
  fetchFn: typeof fetch = fetch,
): FetchJsonClient {
  const request = async (
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
  ) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/json",
    }

    if (body !== undefined) {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetchFn(new URL(path, config.apiUrl), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const responseBody = await readJsonResponse(response)

    if (!response.ok) {
      throw new ApiResponseError(response.status, responseBody)
    }

    return responseBody
  }

  return {
    getJson: (path) => request("GET", path),
    sendJson: (method, path, body) => request(method, path, body),
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
