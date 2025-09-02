import z from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands.names";

export const deleteRealEstateAssetPayloadSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const deleteRealEstateAssetCommandSchema = z.object({
  command: z.literal(
    realEstateCommandsListSchema.enum["delete-real-estate-asset"]
  ),
  payload: deleteRealEstateAssetPayloadSchema,
});

export type DeleteRealEstateAssetCommand = z.infer<
  typeof deleteRealEstateAssetCommandSchema
>;
export type DeleteRealEstateAssetCommandPayload =
  DeleteRealEstateAssetCommand["payload"];
