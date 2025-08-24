import { AddValuationCommandPayload } from "./add-valuation.command.schema";

export const addValuationPayloadExample = {
  id: "re_1234567890",
  date: "2023-10-26",
  value: 300_000,
} satisfies AddValuationCommandPayload;
