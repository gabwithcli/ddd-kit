import { z } from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

export const deleteValuationPayloadSchema = z.object({
  id: z.string().min(1, "Real estate asset ID is required"),
  valuationId: z.string().min(1, "Valuation ID is required"),
});

export const deleteValuationCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["delete-valuation"]),
  payload: deleteValuationPayloadSchema,
});
export type DeleteValuationCommand = z.infer<
  typeof deleteValuationCommandSchema
>;
export type DeleteValuationCommandPayload = DeleteValuationCommand["payload"];

// We create a sample payload that conforms to our Zod schema.
// This object will be used to pre-populate the request body in API documentation tools.
// It's a great way to provide a sensible default for anyone testing the endpoint.
export const deleteValuationPayloadExample = {
  id: "re_1234567890",
  valuationId: "val_0987654321",
} satisfies DeleteValuationCommandPayload;
