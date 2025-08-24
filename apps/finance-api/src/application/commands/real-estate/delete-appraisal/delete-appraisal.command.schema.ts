import { z } from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands";

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
