import { z } from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands.names";

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
