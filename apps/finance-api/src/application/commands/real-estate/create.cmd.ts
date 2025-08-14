/**
 * CreateRealEstate command:
 * - Validates through the Aggregate factory.
 * - Saves the new aggregate atomically.
 * - Returns just the id (handlers can fetch read models for responses).
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { z } from "zod";
import {
  RealEstate,
  pp,
} from "../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../domain/real-estate/types";

/**
 * Zod schema used by the request-handler at the edge.
 * - `idempotencyKey` is optional; when omitted we default to null.
 * - `baseCurrency` is a 3-letter code; we keep it simple (no transform).
 */
export const CreateRealEstateBody = z.object({
  idempotencyKey: z.string().nullable().optional().default(null),
  details: z.object({
    name: z.string().min(1, "Name is required"),
    address: z.object({
      line1: z.string().min(1, "Address line1 is required"),
      line2: z.string().optional(),
      postalCode: z.string().min(1, "Postal code is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().optional(),
      country: z.string().min(1, "Country is required"),
    }),
    notes: z.string().optional(),
    baseCurrency: z.string().length(3, "Use 3-letter currency code"),
  }),
  purchase: z.object({
    date: z.string(), // ISO date string; domain will enforce >= purchase
    value: z.number().positive(), // positive number
  }),
});

// If you want a typed DTO directly from the schema (handy in tests)
export type CreateRealEstateBodyInput = z.infer<typeof CreateRealEstateBody>;

type Env = {
  repo: AggregateCrudRepository<RealEstate>;
  newId(): string; // e.g., ulid
  now(): Date; // clock injection for testability
};

export type CreateRealEstateCmd = {
  idempotencyKey?: string | null;
  userId: string;
  details: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      postalCode: string;
      city: string;
      state?: string;
      country: string;
    };
    notes?: string;
    baseCurrency: string;
  };
  purchase: { date: string; value: number };
};

export type CreateRealEstateRes = { id: string };

/**
 * Application service:
 * - constructs the aggregate via factory (enforces invariants),
 * - persists via repository,
 * - returns a minimal response DTO.
 */
export async function createRealEstate(
  env: Env,
  tx: Tx,
  cmd: CreateRealEstateCmd
): Promise<CreateRealEstateRes> {
  const id = `re_${env.newId()}`;

  const agg = RealEstate.create({
    id,
    userId: cmd.userId,
    details: {
      name: cmd.details.name,
      address: Address.of(cmd.details.address),
      notes: cmd.details.notes,
      baseCurrency: cmd.details.baseCurrency,
    },
    purchase: pp(
      cmd.purchase.date,
      cmd.purchase.value,
      cmd.details.baseCurrency
    ),
    now: () => env.now().toISOString(),
  });

  await env.repo.save(tx, agg);
  return { id };
}
