/**
 * A minimal, generic in-memory stand-in for @supabase/supabase-js's query
 * builder, used only by scripts/test-plugin-governance-boundary.ts to drive
 * the *real* lib/plugins/* functions through specific fixtures without a
 * network or database dependency. It implements exactly the chain shapes
 * this repository's repositories/*.ts files actually use:
 * select/eq/order/limit/maybeSingle/single, insert().select().single(),
 * update().eq().select().single(), and a bare-select thenable for list
 * queries. It is not a supabase-js reimplementation and must never be
 * imported by application code.
 */
export type FakeRow = Record<string, unknown>;

type QueryOp = "select" | "insert" | "update";

class FakeQueryBuilder implements PromiseLike<{ data: unknown; error: null }> {
  private filters: [string, unknown][] = [];
  private limitN: number | null = null;

  constructor(
    private readonly rows: FakeRow[],
    private readonly op: QueryOp,
    private readonly payload?: FakeRow,
  ) {}

  select(_cols?: string) {
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push([col, val]);
    return this;
  }

  order(_col: string, _opts?: unknown) {
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private matching(): FakeRow[] {
    const matched = this.rows.filter((row) => this.filters.every(([col, val]) => row[col] === val));
    return this.limitN !== null ? matched.slice(0, this.limitN) : matched;
  }

  async maybeSingle(): Promise<{ data: FakeRow | null; error: null }> {
    if (this.op === "insert") {
      const inserted: FakeRow = { id: `fake-${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString(), ...this.payload };
      this.rows.push(inserted);
      return { data: inserted, error: null };
    }
    if (this.op === "update") {
      const idx = this.rows.findIndex((row) => this.filters.every(([col, val]) => row[col] === val));
      if (idx === -1) return { data: null, error: null };
      this.rows[idx] = { ...this.rows[idx], ...this.payload };
      return { data: this.rows[idx], error: null };
    }
    return { data: this.matching()[0] ?? null, error: null };
  }

  async single(): Promise<{ data: FakeRow | null; error: null }> {
    return this.maybeSingle();
  }

  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const result = { data: this.matching(), error: null as null };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

class FakeTable {
  constructor(private readonly rows: FakeRow[]) {}
  select(cols?: string) {
    return new FakeQueryBuilder(this.rows, "select").select(cols);
  }
  insert(payload: FakeRow) {
    return new FakeQueryBuilder(this.rows, "insert", payload);
  }
  update(payload: FakeRow) {
    return new FakeQueryBuilder(this.rows, "update", payload);
  }
}

/**
 * A fake `SupabaseClient<Database>`-shaped object. Only `.from(table)` and
 * `.auth.getUser()` are implemented -- the only two entry points every
 * lib/plugins/* function and repositories/*.ts function actually calls.
 */
export class FakeSupabaseClient {
  private readonly tables = new Map<string, FakeRow[]>();
  private currentUser: { id: string } | null = null;

  auth = {
    getUser: async () => ({ data: { user: this.currentUser } }),
  };

  setUser(user: { id: string } | null) {
    this.currentUser = user;
  }

  seed(table: string, rows: FakeRow[]) {
    this.tables.set(table, [...rows]);
  }

  from(table: string) {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return new FakeTable(this.tables.get(table)!);
  }
}
