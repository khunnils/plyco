import { templateSlugSchema } from "@plyco/contracts";
import { type FastifyInstance } from "fastify";
import { z } from "zod";

import { ApiError } from "../../infrastructure/errors.js";
import {
  renderDocumentHtml,
  renderPublicDocumentPage,
} from "../../infrastructure/document-html.js";
import { type DocumentRepository } from "./repository.js";

const publicDocumentParamsSchema = z.object({
  orgSlug: templateSlugSchema,
  templateSlug: templateSlugSchema,
});

export async function registerPublicDocumentRoutes(
  app: FastifyInstance,
  { documentRepository }: { documentRepository: DocumentRepository },
) {
  app.get<{ Params: { orgSlug: string; templateSlug: string } }>(
    "/public/:orgSlug/:templateSlug",
    async (request, reply) => {
      const params = publicDocumentParamsSchema.parse(request.params);
      const publicDocument = await documentRepository.getPublicDocument(
        params.orgSlug,
        params.templateSlug,
      );

      if (!publicDocument) {
        throw new ApiError(
          "PUBLIC_DOCUMENT_NOT_FOUND",
          "Public document was not found.",
          404,
        );
      }

      const bodyHtml = renderDocumentHtml(publicDocument.document.renderedContent);
      const html = renderPublicDocumentPage({
        title: publicDocument.document.title,
        organizationName: publicDocument.organizationName,
        generatedAt: publicDocument.document.generatedAt,
        bodyHtml,
      });

      return reply
        .header("Content-Type", "text/html; charset=utf-8")
        .header("Cache-Control", "public, max-age=300")
        .header("X-Robots-Tag", "index")
        .header(
          "Content-Security-Policy",
          "default-src 'none'; style-src 'unsafe-inline'",
        )
        .send(html);
    },
  );
}
