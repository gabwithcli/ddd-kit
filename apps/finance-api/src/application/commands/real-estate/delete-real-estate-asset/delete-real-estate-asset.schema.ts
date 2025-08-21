import z from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

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

// We create a sample payload that conforms to our Zod schema.
// This object will be used to pre-populate the request body in API documentation tools.
// It's a great way to provide a sensible default for anyone testing the endpoint.
export const deleteRealEstateAssetPayloadExample = {
  id: "re_1234567890",
} satisfies DeleteRealEstateAssetCommandPayload;
