import { LangfuseClient, type LangfuseClientParams } from "@langfuse/client"

import { ApiError } from "./errors.js"

export type ResolvedPrompt = {
  content: string
  inputVariables?: Record<string, string>
  metadata: {
    name: string
    version: number
    isFallback: boolean
  }
}

export interface PromptClient {
  compilePrompt(
    name: string,
    variables: Record<string, string>,
  ): Promise<ResolvedPrompt>
}

const compiledPromptToText = (compiled: unknown): string => {
  if (typeof compiled === "string") {
    return compiled
  }

  if (Array.isArray(compiled)) {
    return compiled
      .map((message) => {
        if (
          typeof message === "object" &&
          message &&
          "content" in message &&
          typeof message.content === "string"
        ) {
          const role =
            "role" in message && typeof message.role === "string"
              ? `${message.role}: `
              : ""

          return `${role}${message.content}`
        }

        return ""
      })
      .filter(Boolean)
      .join("\n\n")
  }

  throw new ApiError(
    "PROMPT_COMPILE_FAILED",
    "Compiled prompt did not return supported content.",
    502,
  )
}

export class LangfusePromptClient implements PromptClient {
  constructor(private readonly client = new LangfuseClient()) {}

  static fromConfig(params: LangfuseClientParams) {
    return new LangfusePromptClient(new LangfuseClient(params))
  }

  async compilePrompt(
    name: string,
    variables: Record<string, string>,
  ): Promise<ResolvedPrompt> {
    try {
      const prompt = await this.client.prompt.get(name)
      const content = compiledPromptToText(prompt.compile(variables))

      if (!content) {
        throw new ApiError(
          "PROMPT_COMPILE_FAILED",
          "Compiled prompt was empty.",
          502,
        )
      }

      return {
        content,
        inputVariables: variables,
        metadata: {
          name: prompt.name,
          version: prompt.version,
          isFallback: prompt.isFallback,
        },
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        "PROMPT_LOAD_FAILED",
        "Unable to load provider lookup prompt.",
        502,
        promptLoadDetails(error),
      )
    }
  }
}

const promptLoadDetails = (error: unknown) => {
  if (!(error instanceof Error)) {
    return undefined
  }

  return {
    cause: error.name,
    message: error.message.slice(0, 500),
    statusCode:
      "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : undefined,
  }
}
