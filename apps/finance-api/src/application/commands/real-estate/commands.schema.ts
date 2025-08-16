import { z } from "zod";
import { createRealEstateCommandSchema } from "./create/create.schema";
import { deleteRealEstateCommandSchema } from "./delete/delete.schema";

export const RealEstateCommandRequest = z.discriminatedUnion("command", [
  createRealEstateCommandSchema,
  deleteRealEstateCommandSchema,
] as const);
