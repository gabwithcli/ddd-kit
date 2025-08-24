import { AddAppraisalCommandPayload } from "./add-appraisal.command.schema";

export const addAppraisalPayloadExample = {
  id: "re_1234567890",
  date: "2023-10-26",
  value: 350_000,
} satisfies AddAppraisalCommandPayload;
