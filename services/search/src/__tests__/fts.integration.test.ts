/**
 * FTS integration test.
 *
 * Requires a real PostgreSQL instance. Set DATABASE_URL before running:
 *
 *   DATABASE_URL=postgres://user:pass@localhost:5432/testdb \
 *     jest --testPathPattern=fts.integration.test.ts
 *
 * In CI this is provided by the PostgreSQL service container defined in
 * .github/workflows/search-ci.yml.
 *
 * The test bootstraps minimal `profiles` and `posts` tables, seeds data,
 * runs searches, and tears everything down in a transaction-scoped cleanup.
 */

import { Pool } from "pg";
import { searchAll, searchProfiles, searchPosts } from "../search";

// Skip the entire suite when DATABASE_URL is absent (unit-test environment).
const RUN = Boolean(process.env.DATABASE_URL);
const describe_ = RUN ? describe : describe.skip;

let pool: Pool;

beforeAll(async () => {
  if (!RUN) return;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Create minimal tables that mirror the indexer schema relevant to search.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      address TEXT PRIMARY KEY,
      username TEXT,
      bio TEXT
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Seed fixture data
  await pool.query(`
    INSERT INTO profiles (address, username, bio) VALUES
      ('GAAA', 'alice_linkora', 'DeFi creator and Stellar enthusiast'),
      ('GBBB', 'bob_builder',   'Building on Soroban every day'),
      ('GCCC', 'carol',         'Just here to learn')
    ON CONFLICT DO NOTHING
  `);
  await pool.query(`
    INSERT INTO posts (author, content) VALUES
      ('GAAA', 'Stellar smart contracts are changing decentralised finance'),
      ('GBBB', 'Soroban tip: use custom types for better on-chain data modelling'),
      ('GCCC', 'Good morning everyone on Linkora!')
    ON CONFLICT DO NOTHING
  `);
});

afterAll(async () => {
  if (!RUN) return;
  // Clean up seeded rows so repeated runs stay idempotent.
  await pool.query(`DELETE FROM profiles WHERE address IN ('GAAA','GBBB','GCCC')`);
  await pool.query(`DELETE FROM posts WHERE author IN ('GAAA','GBBB','GCCC')`);
  await pool.end();
});

describe_("FTS integration — searchAll", () => {
  it("finds profiles by username", async () => {
    const results = await searchAll(pool, "alice");
    expect(results.some((r) => r.ref === "GAAA")).toBe(true);
  });

  it("finds posts by content keyword", async () => {
    const results = await searchAll(pool, "soroban");
    expect(results.some((r) => r.type === "post")).toBe(true);
  });

  it("returns empty array for unmatched query", async () => {
    const results = await searchAll(pool, "zzznomatchwilleveroccur99999");
    expect(results).toHaveLength(0);
  });

  it("respects the limit parameter", async () => {
    const results = await searchAll(pool, "linkora", 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe_("FTS integration — searchProfiles", () => {
  it("finds profiles by bio text", async () => {
    const results = await searchProfiles(pool, "stellar");
    expect(results.every((r) => r.type === "profile")).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe_("FTS integration — searchPosts", () => {
  it("finds posts by content", async () => {
    const results = await searchPosts(pool, "decentralised");
    expect(results.every((r) => r.type === "post")).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });
});
