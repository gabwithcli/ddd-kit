import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "@acme/sdk-lite";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import { deleteAppraisalPayloadSchema } from "../../../../application/commands/real-estate/delete-appraisal/delete-appraisal.schema";

export const deleteAppraisalRoute = createRoute({
  method: "post",
  path: "/delete-appraisal",
  tags: ["Real Estate"],
  summary: "Delete an appraisal from an asset",
  request: {
    body: jsonContent(
      deleteAppraisalPayloadSchema,
      "The ID of the appraisal to delete from the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Appraisal deleted successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset or appraisal was not found.`
      ),
    },
  },
});
