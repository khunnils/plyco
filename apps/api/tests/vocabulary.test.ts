import { describe, expect, it } from "vitest";

import { createTestApp } from "./helpers.js";
import { profileBody } from "./helpers.js";

describe("vocabulary API", () => {
  it("returns countries and organization vocabulary", async () => {
    const app = await createTestApp();
    const countriesResponse = await app.inject({
      method: "GET",
      url: "/countries",
    });

    expect(countriesResponse.statusCode).toBe(200);
    expect(countriesResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "US",
          name: "United States of America",
        }),
      ]),
    );

    const vocabularyResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/vocabulary",
    });

    expect(vocabularyResponse.statusCode).toBe(200);
    expect(vocabularyResponse.json().codeSets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          codeSetId: "industries",
          isSystem: false,
          usesHints: true,
          codes: expect.arrayContaining([
            expect.objectContaining({
              codeId: "artificial_intelligence",
              description: "Products built around machine learning.",
            }),
          ]),
        }),
        expect.objectContaining({
          codeSetId: "dpa_status",
          isSystem: true,
        }),
      ]),
    );
  });

  it("supports editing organization vocabulary codes", async () => {
    const app = await createTestApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/vocabulary/industries/codes",
      payload: {
        codeId: "robotics",
        name: "Robotics",
        description: "Robotic systems and automation.",
        active: true,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      codeId: "robotics",
      name: "Robotics",
      description: "Robotic systems and automation.",
      isSystem: false,
    });

    const updateResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/vocabulary/industries/codes/robotics",
      payload: {
        codeId: "robotics",
        name: "Robotics and automation",
        description: "Industrial and software automation.",
        active: true,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      name: "Robotics and automation",
      description: "Industrial and software automation.",
    });

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/organizations/org-test/vocabulary/industries/codes/robotics",
    });

    expect(deleteResponse.statusCode).toBe(204);

    const deleteSystemDerivedResponse = await app.inject({
      method: "DELETE",
      url: "/organizations/org-test/vocabulary/industries/codes/edtech",
    });

    expect(deleteSystemDerivedResponse.statusCode).toBe(204);

    const vocabularyAfterDeleteResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/vocabulary",
    });
    const industriesAfterDelete = vocabularyAfterDeleteResponse
      .json()
      .codeSets.find(
        (codeSet: { codeSetId: string }) => codeSet.codeSetId === "industries",
      );

    expect(vocabularyAfterDeleteResponse.statusCode).toBe(200);
    expect(
      industriesAfterDelete.codes.map(
        (code: { codeId: string }) => code.codeId,
      ),
    ).not.toContain("edtech");

    const vocabularyAfterBackfillResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/vocabulary",
    });
    const industriesAfterBackfill = vocabularyAfterBackfillResponse
      .json()
      .codeSets.find(
        (codeSet: { codeSetId: string }) => codeSet.codeSetId === "industries",
      );

    expect(
      industriesAfterBackfill.codes.map(
        (code: { codeId: string }) => code.codeId,
      ),
    ).not.toContain("edtech");

    const recreateDeletedResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/vocabulary/industries/codes",
      payload: {
        codeId: "edtech",
        name: "EdTech",
        active: true,
      },
    });

    expect(recreateDeletedResponse.statusCode).toBe(404);

    const saveDeletedCodeResponse = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        company: {
          ...profileBody.company,
          industries: ["edtech"],
        },
      },
    });

    expect(saveDeletedCodeResponse.statusCode).toBe(400);
  });
});
