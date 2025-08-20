import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { addAppraisalPayloadSchema } from "../../../../application/commands/real-estate/add-appraisal/add-appraisal.schema";

export const addAppraisalRoute = createRoute({
  method: "post",
  path: "/add-appraisal",
  tags: ["Real Estate"],
  summary: "Add an appraisal to a real estate asset",
  request: {
    body: openapiJsonContent(
      addAppraisalPayloadSchema,
      "The appraisal details to add to the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.CREATED}: Appraisal added successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`
      ),
    },
  },
});
