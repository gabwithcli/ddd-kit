import { z } from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

export const deleteAppraisalPayloadSchema = z.object({
  id: z.string().min(1, "Real estate asset ID is required"),
  appraisalId: z.string().min(1, "Appraisal ID is required"),
});

export const deleteAppraisalCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["delete-appraisal"]),
  payload: deleteAppraisalPayloadSchema,
});

export type DeleteAppraisalCommand = z.infer<
  typeof deleteAppraisalCommandSchema
>;
export type DeleteAppraisalCommandPayload = DeleteAppraisalCommand["payload"];

// We create a sample payload that conforms to our Zod schema.
// This object will be used to pre-populate the request body in API documentation tools.
// It's a great way to provide a sensible default for anyone testing the endpoint.
export const deleteAppraisalPayloadExample = {
  id: "re_1234567890",
  appraisalId: "appr_0987654321",
} satisfies DeleteAppraisalCommandPayload;
