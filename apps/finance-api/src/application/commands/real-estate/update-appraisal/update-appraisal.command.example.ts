import { UpdateAppraisalCommandPayload } from "./update-appraisal.command.schema";

export const updateAppraisalPayloadExample = {
  id: "re_1234567890",
  appraisalId: "appr_0987654321",
  date: "2023-10-26",
  value: 400_000,
} satisfies UpdateAppraisalCommandPayload;
