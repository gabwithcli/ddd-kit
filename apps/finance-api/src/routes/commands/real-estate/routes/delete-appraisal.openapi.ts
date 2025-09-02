import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { deleteAppraisalPayloadExample } from "src/application/commands/real-estate/delete-appraisal/delete-appraisal.command.example";
import { deleteAppraisalPayloadSchema } from "src/application/commands/real-estate/delete-appraisal/delete-appraisal.command.schema";

export const deleteAppraisalRoute = createRoute({
  method: "post",
  path: "/delete-appraisal",
  tags: ["Real Estate"],
  summary: "Delete an appraisal from an asset",
  request: {
    body: openapiJsonContent(
      "The ID of the appraisal to delete from the real estate asset.",
      deleteAppraisalPayloadSchema,
      deleteAppraisalPayloadExample
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Appraisal deleted successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The asset or appraisal was not found.`,
        ErrorResponseSchema
      ),
    },
  },
});
