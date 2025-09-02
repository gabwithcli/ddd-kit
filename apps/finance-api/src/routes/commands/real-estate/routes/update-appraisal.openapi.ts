import { createRoute, z } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  idempotencyKeyHeader,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { updateAppraisalPayloadExample } from "src/application/commands/real-estate/update-appraisal/update-appraisal.command.example";
import { updateAppraisalPayloadSchema } from "src/application/commands/real-estate/update-appraisal/update-appraisal.command.schema";

export const updateAppraisalRoute = createRoute({
  method: "post",
  path: "/update-appraisal",
  tags: ["Real Estate"],
  summary: "Update an existing appraisal on an asset",
  request: {
    headers: z.object({
      ...idempotencyKeyHeader("Prevents duplicate updates."),
    }),
    body: openapiJsonContent(
      "The appraisal details to update on the real estate asset.",
      updateAppraisalPayloadSchema,
      updateAppraisalPayloadExample
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Appraisal updated successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The asset or appraisal was not found.`,
        ErrorResponseSchema
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...openapiJsonContent(
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`,
        ErrorResponseSchema
      ),
    },
  },
});
