/**
 * AddAppraisal command:
 * - Loads the aggregate
 * - Applies domain behavior (addAppraisal)
 * - Persists atomically
 * - Returns { id }
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { z } from "zod";
import { RealEstate, pp } from "../../../domain/real-estate/aggregate";

/**
 * Zod body schema used by the request-handler at the edge.
 * Route will merge path param `:id` + auth into the command DTO.
 */
export const AddAppraisalBody = z.object({
  amount: z.number().positive(),
  date: z.string(), // ISO date string
});

type Env = {
  repo: AggregateCrudRepository<RealEstate>;
  // clock not required here; pp(date, amount, currency) already takes date string
};

export type AddAppraisalCmd = {
  id: string; // from route param
  userId: string; // from auth
  amount: number;
  date: string;
};

export type AddAppraisalRes = { id: string };

export async function addAppraisal(
  env: Env,
  tx: Tx,
  cmd: AddAppraisalCmd
): Promise<AddAppraisalRes> {
  const current = await env.repo.load(tx, cmd.id);
  if (!current) throw new Error("RealEstate not found");
  if (current.userId !== cmd.userId) throw new Error("Forbidden");

  current.addAppraisal(pp(cmd.date, cmd.amount, current.details.baseCurrency));

  await env.repo.save(tx, current);
  return { id: current.id };
}
