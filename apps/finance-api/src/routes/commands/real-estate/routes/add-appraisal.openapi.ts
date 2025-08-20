import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "@acme/sdk-lite";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import { addAppraisalPayloadSchema } from "../../../../application/commands/real-estate/add-appraisal/add-appraisal.schema";

export const addAppraisalRoute = createRoute({
  method: "post",
  path: "/add-appraisal",
  tags: ["Real Estate"],
  summary: "Add an appraisal to a real estate asset",
  request: {
    body: jsonContent(
      addAppraisalPayloadSchema,
      "The appraisal details to add to the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.CREATED}: Appraisal added successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`
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
