import z from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

// The payload for a delete command is empty, as the ID is in the URL.
export const deleteRealEstatePayloadSchema = z.object({});

export const deleteRealEstateCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["delete-real-estate"]),
  payload: deleteRealEstatePayloadSchema,
});

export type DeleteRealEstateCommand = z.infer<
  typeof deleteRealEstateCommandSchema
>;
// export type DeleteRealEstateCommandPayload = DeleteRealEstateCommand["payload"];
