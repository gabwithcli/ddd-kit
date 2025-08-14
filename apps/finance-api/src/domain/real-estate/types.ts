import { ValueObject } from "@acme/sdk-lite/domain";

export class Money extends ValueObject<{ amount: number; currency: string }> {
  static of(amount: number, currency: string) {
    return new Money({ amount, currency });
  }
}

export class Address extends ValueObject<{
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: string;
}> {
  static of(a: Omit<Address["props"], never>) {
    return new Address(a);
  }
}

export type PricePoint = { date: string; value: Money };

export type RealEstateDetails = {
  name: string;
  address: Address;
  notes?: string;
  baseCurrency: string;
};
