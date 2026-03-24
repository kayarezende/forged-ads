import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

async function sqlTemplate(strings: TemplateStringsArray, ...values: unknown[]) {
  const text = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
  const result = await pool.query(text, values);
  return result.rows;
}

export default Object.assign(sqlTemplate, {
  async one<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T | null> {
    const rows = await sqlTemplate(strings, ...values);
    return (rows[0] as T) ?? null;
  }
});
