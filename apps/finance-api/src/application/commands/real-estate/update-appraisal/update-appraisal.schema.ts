import { z } from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

export const updateAppraisalPayloadSchema = z
  .object({
    id: z.string().min(1, "Real estate asset ID is required"),
    appraisalId: z.string().min(1, "Appraisal ID is required"),
    date: z
      .string()
      .date("Must be a valid date string (YYYY-MM-DD)")
      .optional(),
    value: z.number().positive("Value must be a positive number").optional(),
  })
  .refine((data) => data.date || data.value, {
    message: "At least one field (date or value) must be provided for update.",
  });

export const updateAppraisalCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["update-appraisal"]),
  payload: updateAppraisalPayloadSchema,
});

export type UpdateAppraisalCommand = z.infer<
  typeof updateAppraisalCommandSchema
>;
export type UpdateAppraisalCommandPayload = UpdateAppraisalCommand["payload"];
