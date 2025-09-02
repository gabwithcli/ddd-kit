import { ValueObject } from "ddd-kit/domain";
import { Money } from "../shared/money";

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

/**
 * PricePoint represents the immutable purchase fact.
 */
export type PricePoint = {
  date: string;
  value: Money;
};

/**
 * Defines the structure for a Valuation (informal estimate).
 * This is a less formal assessment of the property's value, often used for quick evaluations.
 */
export type Appraisal = {
  id: string;
  date: string;
  value: Money;
};

/**
 * Defines the structure for a Valuation (formal report).
 * This is a more formal and detailed assessment of the property's value.
 */
export type Valuation = {
  id: string;
  date: string;
  value: Money;
};

export type RealEstateDetails = {
  name: string;
  address: Address;
  notes?: string;
  baseCurrency: string;
};
