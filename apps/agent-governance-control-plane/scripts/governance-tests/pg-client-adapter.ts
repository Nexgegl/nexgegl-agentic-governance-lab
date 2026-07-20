/**
 * A minimal, generic Supabase-client-shaped adapter backed by a *real*
 * `pg.Client` connection, used only by
 * scripts/test-kfsa-integration-concurrency.ts to drive the *actual*
 * lib/kfsa/promotion-submission.ts (submitPromotionRequestForEvaluation)
 * against real Postgres with genuine concurrency -- something
 * scripts/governance-tests/fake-client.ts's in-memory stand-in cannot do,
 * since it has no transactions or unique constraints of its own to race
 * against.
 *
 * Implements exactly the chain shapes this repository's repositories/*.ts
 * files actually use: select/eq/order/maybeSingle/single, and
 * insert/update with .select().single(). It is not a PostgREST
 * reimplementation and must never be imported by application code -- it
 * exists purely so a test can issue real SQL under real RLS as either an
 * ordinary tenant (role=authenticated, a real request.jwt.claim.sub) or
 * the service-role administrative path (role=service_role), exactly
 * mirroring what a real Supabase project's PostgREST layer would enforce.
 */
import type { Client } from "pg";

interface Filter {
  col: string;
  val: unknown;
}

type QueryOp = "select" | "insert" | "update";

class PgQueryBuilder implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: Filter[] = [];
  private orderCol: string | null = null;
  private orderAscending = true;
  private op: QueryOp = "select";
  private payload?: Record<string, unknown>;

  constructor(
    private readonly client: Client,
    private readonly table: string,
  ) {}

  select(_cols?: string) {
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAscending = opts?.ascending ?? true;
    return this;
  }

  insert(payload: Record<string, unknown>) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  private async execute(): Promise<{ data: unknown[] | null; error: unknown }> {
    try {
      if (this.op === "insert") {
        const cols = Object.keys(this.payload!);
        const vals = cols.map((c) => this.payload![c]);
        const placeholders = cols.map((_, i) => `$${i + 1}`);
        const result = await this.client.query(`insert into public.${this.table} (${cols.join(", ")}) values (${placeholders.join(", ")}) returning *`, vals);
        return { data: result.rows, error: null };
      }
      if (this.op === "update") {
        const cols = Object.keys(this.payload!);
        const vals: unknown[] = cols.map((c) => this.payload![c]);
        const setClauses = cols.map((c, i) => `${c} = $${i + 1}`);
        const whereClauses = this.filters.map((f) => {
          vals.push(f.val);
          return `${f.col} = $${vals.length}`;
        });
        const result = await this.client.query(`update public.${this.table} set ${setClauses.join(", ")} where ${whereClauses.join(" and ")} returning *`, vals);
        return { data: result.rows, error: null };
      }
      const vals: unknown[] = [];
      const whereClauses = this.filters.map((f) => {
        vals.push(f.val);
        return `${f.col} = $${vals.length}`;
      });
      let sql = `select * from public.${this.table}`;
      if (whereClauses.length > 0) sql += ` where ${whereClauses.join(" and ")}`;
      if (this.orderCol) sql += ` order by ${this.orderCol} ${this.orderAscending ? "asc" : "desc"}`;
      const result = await this.client.query(sql, vals);
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async maybeSingle(): Promise<{ data: unknown; error: unknown }> {
    const { data, error } = await this.execute();
    if (error) return { data: null, error };
    return { data: (data as unknown[])[0] ?? null, error: null };
  }

  async single(): Promise<{ data: unknown; error: unknown }> {
    return this.maybeSingle();
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/** A Supabase-client-shaped object over a real pg.Client. `userId` is baked in for `.auth.getUser()` -- pass null for the service-role path, which has no user identity of its own. */
export class PgSupabaseClient {
  constructor(
    private readonly client: Client,
    private readonly userId: string | null,
  ) {}

  auth = {
    getUser: async () => ({ data: { user: this.userId ? { id: this.userId } : null } }),
  };

  from(table: string) {
    return new PgQueryBuilder(this.client, table);
  }
}
