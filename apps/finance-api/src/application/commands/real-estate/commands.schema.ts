import { z } from "zod";
import { createRealEstateCommandSchema } from "./create-real-estate/create.schema";
import { deleteRealEstateCommandSchema } from "./delete-real-estate/delete.schema";

export const RealEstateCommandRequest = z.discriminatedUnion("command", [
  createRealEstateCommandSchema,
  deleteRealEstateCommandSchema,
] as const);
