/**
 * AddMarketValuation command:
 * - Loads the aggregate
 * - Applies domain behavior (addMarketValuation)
 * - Persists atomically
 * - Returns { id }
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { z } from "zod";
import {
  RealEstate,
  pp,
} from "../../../domain/real-estate/real-estate.aggregate";

/**
 * Zod body schema used by the request-handler at the edge.
 */
export const AddMarketValuationBody = z.object({
  amount: z.number().positive(),
  date: z.string(), // ISO date string
});

type Env = {
  repo: AggregateCrudRepository<RealEstate>;
};

export type AddMarketValuationCmd = {
  id: string; // from route param
  userId: string; // from auth
  amount: number;
  date: string;
};

export type AddMarketValuationRes = { id: string };

export async function addMarketValuation(
  env: Env,
  tx: Tx,
  cmd: AddMarketValuationCmd
): Promise<AddMarketValuationRes> {
  const current = await env.repo.load(tx, cmd.id);
  if (!current) throw new Error("RealEstate not found");
  if (current.userId !== cmd.userId) throw new Error("Forbidden");

  current.addMarketValuation(
    pp(cmd.date, cmd.amount, current.details.baseCurrency)
  );

  await env.repo.save(tx, current);
  return { id: current.id };
}
