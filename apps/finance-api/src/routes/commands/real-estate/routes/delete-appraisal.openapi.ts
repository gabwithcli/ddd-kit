import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { deleteAppraisalPayloadSchema } from "../../../../application/commands/real-estate/delete-appraisal/delete-appraisal.schema";

export const deleteAppraisalRoute = createRoute({
  method: "post",
  path: "/delete-appraisal",
  tags: ["Real Estate"],
  summary: "Delete an appraisal from an asset",
  request: {
    body: openapiJsonContent(
      "The ID of the appraisal to delete from the real estate asset.",
      deleteAppraisalPayloadSchema
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
