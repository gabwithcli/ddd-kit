import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { addAppraisalPayloadSchema } from "../../../../application/commands/real-estate/add-appraisal/add-appraisal.command.example";

export const addAppraisalRoute = createRoute({
  method: "post",
  path: "/add-appraisal",
  tags: ["Real Estate"],
  summary: "Add an appraisal to a real estate asset",
  request: {
    body: openapiJsonContent(
      "The appraisal details to add to the real estate asset.",
      addAppraisalPayloadSchema
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...openapiJsonContent(
        `${HttpPhrases.CREATED}: Appraisal added successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`,
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
