import {
  createDocumentSchema,
  createTemplateFromSystemSchema,
  templateInputSchema,
} from "@plyco/shared"
import { type FastifyInstance } from "fastify"

import {
  Jinja2Renderer,
  ReportContextBuilder,
  templateSourceHash,
} from "../../document-generation.js"
import { ApiError } from "../../errors.js"
import { requireOrganizationMembership } from "../../organization-context.js"
import { type SystemTemplateSource } from "../../system-templates.js"
import { type DocumentPdfStorage } from "../../document-pdfs.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type OrganizationRepository } from "../organizations/repository.js"
import { type VendorRepository } from "../vendors/repository.js"
import { type VocabularyRepository } from "../vocabulary/repository.js"
import { type DocumentRepository } from "./repository.js"

export async function registerDocumentRoutes(
  app: FastifyInstance,
  {
    documentRepository,
    documentPdfStorage,
    organizationRepository,
    systemTemplateSource,
    vendorRepository,
    vocabularyRepository,
    accountRepository,
  }: {
    accountRepository: AccountRepository
    documentRepository: DocumentRepository
    documentPdfStorage: DocumentPdfStorage
    organizationRepository: OrganizationRepository
    systemTemplateSource: SystemTemplateSource
    vendorRepository: VendorRepository
    vocabularyRepository: VocabularyRepository
  },
) {
  const contextBuilder = new ReportContextBuilder()
  const renderer = new Jinja2Renderer()

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/templates",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return {
        systemTemplates: await systemTemplateSource.listSystemTemplates(),
        organizationTemplates: await documentRepository.listTemplates(
          request.params.organizationId,
        ),
      }
    },
  )

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/documents",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const snapshot = {
        organization: await organizationRepository.getOrganization(
          request.params.organizationId,
        ),
        businessActivities: await vendorRepository.listBusinessActivities(
          request.params.organizationId,
        ),
        vendors: await vendorRepository.listVendors(
          request.params.organizationId,
        ),
        serviceVendorUses: await vendorRepository.listServiceVendorUses(
          request.params.organizationId,
        ),
      }
      const members = await accountRepository.listOrganizationMembers(
        request.params.organizationId,
      )
      const vocabulary = await vocabularyRepository.listVocabulary(
        request.params.organizationId,
      )

      return documentRepository.listDocumentSummaries(
        request.params.organizationId,
        (template) =>
          templateSourceHash(
            template,
            contextBuilder.build(snapshot, template, members, vocabulary),
          ),
      )
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/templates",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = createTemplateFromSystemSchema.parse(request.body)
      const systemTemplates = await systemTemplateSource.listSystemTemplates()
      const systemTemplate = systemTemplates.find(
        (template) => template.slug === body.sourceSystemTemplateSlug,
      )

      if (!systemTemplate) {
        throw new ApiError(
          "SYSTEM_TEMPLATE_NOT_FOUND",
          "System template was not found.",
          404,
        )
      }

      const template = await documentRepository.createTemplateFromSystem(
        request.params.organizationId,
        systemTemplate,
      )

      return reply.status(201).send(template)
    },
  )

  app.put<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/templates/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = templateInputSchema.parse(request.body)
      await validatePolicyMemberIds(
        accountRepository,
        request.params.organizationId,
        [body.policyOwnerUserId, body.policyApproverUserId],
      )
      const template = await documentRepository.updateTemplate(
        request.params.organizationId,
        request.params.id,
        body,
      )

      if (!template) {
        throw new ApiError(
          "TEMPLATE_NOT_FOUND",
          "Template was not found.",
          404,
        )
      }

      return reply.send(template)
    },
  )

  app.delete<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/templates/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const deleted = await documentRepository.deleteTemplate(
        request.params.organizationId,
        request.params.id,
      )

      if (!deleted) {
        throw new ApiError("TEMPLATE_NOT_FOUND", "Template was not found.", 404)
      }

      return reply.status(204).send()
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/documents",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = createDocumentSchema.parse(request.body)
      const templates = await documentRepository.listTemplates(
        request.params.organizationId,
      )
      const template = templates.find(
        (currentTemplate) => currentTemplate.id === body.templateId,
      )

      if (!template) {
        throw new ApiError("TEMPLATE_NOT_FOUND", "Template was not found.", 404)
      }

      const existingDocument = await documentRepository.getDocumentForTemplate(
        request.params.organizationId,
        template.id,
      )

      if (existingDocument) {
        throw new ApiError(
          "DOCUMENT_ALREADY_EXISTS",
          "A document has already been generated for this template.",
          409,
          { templateId: template.id },
        )
      }

      const snapshot = {
        organization: await organizationRepository.getOrganization(
          request.params.organizationId,
        ),
        businessActivities: await vendorRepository.listBusinessActivities(
          request.params.organizationId,
        ),
        vendors: await vendorRepository.listVendors(
          request.params.organizationId,
        ),
        serviceVendorUses: await vendorRepository.listServiceVendorUses(
          request.params.organizationId,
        ),
      }
      const context = contextBuilder.build(
        snapshot,
        template,
        await accountRepository.listOrganizationMembers(
          request.params.organizationId,
        ),
        await vocabularyRepository.listVocabulary(request.params.organizationId),
      )
      const renderedContent = renderer.render(template, context)
      const pdf = await documentPdfStorage.generateAndUpload({
        organizationId: request.params.organizationId,
        template,
        title: template.name,
        renderedContent,
      })
      const document = await documentRepository.createDocument({
        template,
        title: template.name,
        renderedContent,
        pdfObjectPath: pdf?.objectPath ?? null,
        sourceHash: templateSourceHash(template, context),
      })

      return reply.status(201).send(document)
    },
  )

  app.get<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/documents/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const document = await documentRepository.getDocument(
        request.params.organizationId,
        request.params.id,
      )

      if (!document) {
        throw new ApiError("DOCUMENT_NOT_FOUND", "Document was not found.", 404)
      }

      return reply.send(document)
    },
  )

  app.get<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/documents/:id/pdf",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const document = await documentRepository.getDocument(
        request.params.organizationId,
        request.params.id,
      )

      if (!document) {
        throw new ApiError("DOCUMENT_NOT_FOUND", "Document was not found.", 404)
      }

      const objectPath = await documentRepository.getDocumentPdfObjectPath(
        request.params.organizationId,
        request.params.id,
      )

      if (!objectPath) {
        throw new ApiError(
          "DOCUMENT_PDF_NOT_FOUND",
          "Document PDF was not found.",
          404,
        )
      }

      const pdf = await documentPdfStorage.regenerateAndUpload({
        objectPath,
        title: document.title,
        renderedContent: document.renderedContent,
      })

      return reply
        .header("Content-Type", "application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${safePdfFilename(document.title)}"`,
        )
        .send(pdf)
    },
  )
}

async function validatePolicyMemberIds(
  accountRepository: AccountRepository,
  organizationId: string,
  userIds: string[],
) {
  const selectedUserIds = userIds.filter(Boolean)

  if (selectedUserIds.length === 0) {
    return
  }

  const members = await accountRepository.listOrganizationMembers(organizationId)
  const memberUserIds = new Set(members.map((member) => member.userId))
  const invalidUserIds = selectedUserIds.filter(
    (userId) => !memberUserIds.has(userId),
  )

  if (invalidUserIds.length > 0) {
    throw new ApiError(
      "POLICY_MEMBER_NOT_FOUND",
      "Policy owner and approver must be organization members.",
      400,
      { userIds: invalidUserIds },
    )
  }
}

function safePdfFilename(title: string) {
  const filename = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return `${filename || "document"}.pdf`
}
