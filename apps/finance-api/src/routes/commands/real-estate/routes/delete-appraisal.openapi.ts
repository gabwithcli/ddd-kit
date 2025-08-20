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
      deleteAppraisalPayloadSchema,
      "The ID of the appraisal to delete from the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Appraisal deleted successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset or appraisal was not found.`
      ),
    },
  },
});
