import { z } from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

export const addAppraisalPayloadSchema = z.object({
  id: z.string().min(1, "Real estate asset ID is required"),
  date: z.string().date("Must be a valid date string (YYYY-MM-DD)"),
  value: z.number().positive("Value must be a positive number"),
});

export const addAppraisalCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["add-appraisal"]),
  payload: addAppraisalPayloadSchema,
});

export type AddAppraisalCommand = z.infer<typeof addAppraisalCommandSchema>;
export type AddAppraisalCommandPayload = AddAppraisalCommand["payload"];

// We create a sample payload that conforms to our Zod schema.
// This object will be used to pre-populate the request body in API documentation tools.
// It's a great way to provide a sensible default for anyone testing the endpoint.
export const addAppraisalPayloadExample = {
  id: "re_1234567890",
  date: "2023-10-26",
  value: 350_000,
} satisfies AddAppraisalCommandPayload;
