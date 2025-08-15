import { z } from "zod";
import { createRealEstateCommandSchema } from "./create/create.schema";

export const RealEstateCommandRequest = z.discriminatedUnion("command", [
  createRealEstateCommandSchema,
] as const);
