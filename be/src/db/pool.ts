import dotenv from 'dotenv';
dotenv.config();

import { Pool, QueryResult as PgQueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

interface QueryResult {
  rows: any[];
  rowCount: number | null;
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  let result: PgQueryResult;
  try {
    result = await pool.query(text, params);
  } catch (err: any) {
    console.error('Query error:', err.message, 'SQL:', text.substring(0, 200));
    throw err;
  }
  const duration = Date.now() - start;
  if (duration > 100) {
    console.warn('Slow query', { text: text.substring(0, 80), duration, rows: result.rowCount });
  }
  return { rows: result.rows, rowCount: result.rowCount ?? null };
}

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn();
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function buildUpdateSet(fields: Record<string, any>, startIdx = 1): { setClause: string; values: any[]; idx: number } {
  const clauses: string[] = [];
  const values: any[] = [];
  let idx = startIdx;
  for (const [key, val] of Object.entries(fields)) {
    clauses.push(`${key} = $${idx++}`);
    values.push(val === '' && key !== 'notes' ? null : val);
  }
  return { setClause: clauses.join(', '), values, idx };
}

export async function getClient() {
  const client = await pool.connect();
  return {
    query: (text: string, params?: any[]) => client.query(text, params),
    release: () => client.release(),
  };
}

export default pool;
