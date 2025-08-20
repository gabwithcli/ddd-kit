// apps/finance-api/src/domain/shared/money.ts

import {
  DomainInvariantError,
  ValueObject,
} from "../../../../../packages/ddd-kit/dist/domain";

/**
 * Money
 * -----
 * Value Object che rappresenta un importo monetario in una specifica valuta.
 * - Immutabile: ogni operazione ritorna una nuova istanza (niente mutazioni in place).
 * - Uguaglianza per valore: due Money sono uguali se amount e currency coincidono.
 * - Invarianti interne: amount deve essere finito, currency valida e consentita.
 */
export class Money extends ValueObject<{ amount: number; currency: string }> {
  // Whitelist di valute ammesse. Se prevedi molte valute o configurazioni runtime,
  // sposta questa lista in una dependency (es. AppEnv) e passala alla factory.
  private static readonly ALLOWED = [
    "EUR",
    "USD",
    "GBP",
    "CHP",
    "DKK",
  ] as const;

  /**
   * Metodo privato che centralizza la creazione di Money garantendo tutte le invarianti interne.
   * Usato sia da `of` che da `from` per mantenere DRY e consistenza.
   */
  private static create(amount: number, currency: string) {
    // 1) amount deve essere un numero finito (niente NaN/Infinity)
    if (!Number.isFinite(amount)) {
      // MODIFIED: Use DomainInvariantError for consistency
      throw new DomainInvariantError("Amount must be a finite number");
    }

    // 2) normalizza e valida il formato della currency (tre lettere A-Z)
    const cur = currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(cur)) {
      // MODIFIED: Use DomainInvariantError for consistency
      throw new DomainInvariantError(`Invalid currency format: ${currency}`);
    }

    // 3) vincolo di lista ammessa (business rule locale all'app)
    if (!Money.ALLOWED.includes(cur as (typeof Money.ALLOWED)[number])) {
      // MODIFIED: Use DomainInvariantError for consistency
      throw new DomainInvariantError(`Currency not allowed: ${cur}`);
    }

    return new Money({ amount, currency: cur });
  }

  /**
   * Factory method: crea un Money garantendo tutte le invarianti interne.
   * @param amount Importo in unità monetarie (es. 100.50 = 100 euro e 50 cent)
   * @param currency Codice valuta (verrà normalizzato a MAIUSCOLO)
   */
  static of(amount: number, currency: string) {
    return this.create(amount, currency);
  }

  /**
   * Alias di `of` per contesti in cui `from` risulta più leggibile.
   * @param amount Importo in unità monetarie
   * @param currency Codice valuta
   */
  static from(amount: number, currency: string) {
    return this.create(amount, currency);
  }

  /**
   * Somma due Money della stessa valuta e ritorna un nuovo Money.
   * Fallisce se le valute non combaciano (preveniamo errori silenziosi).
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other, "add");
    return new Money({
      amount: this.amount + other.amount,
      currency: this.currency,
    });
  }

  /**
   * Sottrae "other" da questo Money e ritorna un nuovo Money.
   * Anche qui, le valute devono combaciare.
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other, "subtract");
    return new Money({
      amount: this.amount - other.amount,
      currency: this.currency,
    });
  }

  // --- Helpers interni ------------------------------------------------------

  /** Garantisce che le valute coincidano prima di operazioni aritmetiche. */
  private ensureSameCurrency(other: Money, op: "add" | "subtract") {
    if (this.currency !== other.currency) {
      // This could also be a DomainInvariantError if you prefer
      throw new DomainInvariantError(
        `Currency mismatch in ${op}(): ${this.currency} vs ${other.currency}`
      );
    }
  }

  /** Importo numerico (immutabile) */
  get amount(): number {
    return this.props.amount;
  }

  /** Valuta ISO-like (normalizzata a maiuscolo) */
  get currency(): string {
    return this.props.currency;
  }
}
