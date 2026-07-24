import {
  templateInputSchema,
  type TemplateInput,
  type TemplateVariableCatalog,
} from "@plyco/shared";

import {
  loadTemplateVariableCatalog,
  templateLlmResponseSchema,
  validateTemplateReferences,
} from "./template-llm.js";
import { ApiError } from "../../infrastructure/errors.js";
import { type LlmJsonClient } from "../../infrastructure/llm-client.js";
import { type PromptClient } from "../../infrastructure/prompt-client.js";

const PROMPT_NAME = "template_creator";

export interface TemplateCreatorService {
  generate(userInput: string): Promise<TemplateInput>;
}

export class LlmTemplateCreatorService implements TemplateCreatorService {
  constructor(
    private readonly promptClient: PromptClient,
    private readonly llmClient: LlmJsonClient,
    private readonly model: string,
    private readonly loadSchema: () => Promise<TemplateVariableCatalog> =
      loadTemplateVariableCatalog,
  ) {}

  async generate(userInput: string): Promise<TemplateInput> {
    const catalog = await this.loadSchema();
    const prompt = await this.promptClient.compilePrompt(PROMPT_NAME, {
      userInput,
      schema: JSON.stringify(catalog),
    });
    const generated = await this.llmClient.generateJson({
      model: this.model,
      prompt,
      responseSchema: templateLlmResponseSchema,
    });
    const parsed = templateInputSchema.safeParse(generated);

    if (!parsed.success) {
      throw new ApiError(
        "TEMPLATE_CREATOR_INVALID_RESPONSE",
        "Template creator returned an invalid response shape.",
        502,
        parsed.error.flatten(),
      );
    }

    validateTemplateReferences(parsed.data.content, catalog);
    return parsed.data;
  }
}
