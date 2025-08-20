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
