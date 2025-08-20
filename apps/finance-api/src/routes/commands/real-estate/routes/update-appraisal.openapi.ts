import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "../../../../../../../packages/ddd-kit/dist";
import { updateAppraisalPayloadSchema } from "../../../../application/commands/real-estate/update-appraisal/update-appraisal.schema";

export const updateAppraisalRoute = createRoute({
  method: "post",
  path: "/update-appraisal",
  tags: ["Real Estate"],
  summary: "Update an existing appraisal on an asset",
  request: {
    body: jsonContent(
      updateAppraisalPayloadSchema,
      "The appraisal details to update on the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Appraisal updated successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset or appraisal was not found.`
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`
      ),
    },
  },
});
