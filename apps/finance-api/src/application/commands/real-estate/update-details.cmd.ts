/**
 * UpdateRealEstateDetails command:
 * - Loads the aggregate
 * - Applies domain behavior (updateDetails)
 * - Persists atomically
 * - Returns { id }
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { z } from "zod";
import { RealEstate } from "../../../domain/real-estate/aggregate";
import { Address } from "../../../domain/real-estate/types";

/**
 * Zod body schema used by the request-handler at the edge.
 * All fields optional; domain will validate invariants (e.g., name cannot be empty if provided).
 */
export const UpdateRealEstateDetailsBody = z.object({
  name: z.string().min(1).optional(),
  address: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      postalCode: z.string(),
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

type Env = {
  repo: AggregateCrudRepository<RealEstate>;
};

export type UpdateRealEstateDetailsCmd = {
  id: string; // from route param
  userId: string; // from auth
  name?: string;
  address?: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    state?: string;
    country: string;
  };
  notes?: string;
};

export type UpdateRealEstateDetailsRes = { id: string };

export async function updateRealEstateDetails(
  env: Env,
  tx: Tx,
  cmd: UpdateRealEstateDetailsCmd
): Promise<UpdateRealEstateDetailsRes> {
  const current = await env.repo.load(tx, cmd.id);
  if (!current) throw new Error("RealEstate not found");
  if (current.userId !== cmd.userId) throw new Error("Forbidden");

  current.updateDetails({
    name: cmd.name,
    address: cmd.address ? Address.of(cmd.address) : undefined,
    notes: cmd.notes,
  });

  await env.repo.save(tx, current);
  return { id: current.id };
}
