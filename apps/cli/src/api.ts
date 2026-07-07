export type ApiClientConfig = {
  apiKey: string
  apiUrl: string
  fetchFn?: typeof fetch
}

export async function postJson(
  { apiKey, apiUrl, fetchFn = fetch }: ApiClientConfig,
  path: string,
  body: unknown = {},
) {
  const response = await fetchFn(new URL(path, apiUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const parsedBody = await readJsonResponse(response)

  if (!response.ok) {
    throw new ApiResponseError(response.status, parsedBody)
  }

  return parsedBody
}

export async function deleteJson(
  { apiKey, apiUrl, fetchFn = fetch }: ApiClientConfig,
  path: string,
  body: unknown = {},
) {
  const response = await fetchFn(new URL(path, apiUrl), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const parsedBody = await readJsonResponse(response)

  if (!response.ok) {
    throw new ApiResponseError(response.status, parsedBody)
  }

  return parsedBody
}

export class ApiResponseError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Plyco API returned status ${status}`)
  }
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(
      `Plyco API returned non-JSON response with status ${response.status}: ${text.slice(0, 500)}`,
    )
  }
}
