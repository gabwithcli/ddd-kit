import { z } from "zod";
import { createRealEstateCommandSchema } from "./create-real-estate-asset/create.schema";
import { deleteRealEstateCommandSchema } from "./delete-real-estate-asset/delete.schema";

export const RealEstateCommandRequest = z.discriminatedUnion("command", [
  createRealEstateCommandSchema,
  deleteRealEstateCommandSchema,
] as const);
