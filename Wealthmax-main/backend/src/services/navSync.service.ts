import axios from 'axios';
import db from '../config/database';
import logger from '../config/logger';
import config from '../config/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavRecord {
    isin: string;
    scheme_name: string;
    current_nav: number;
    nav_date: string; // 'DD-Mon-YYYY' as returned by AMFI, stored as DATE
}

export interface SyncResult {
    parsed: number;
    upserted: number;
    skipped: number;
    durationMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of rows per SQL batch to keep individual query sizes manageable */
const BATCH_SIZE = 1000;

// ---------------------------------------------------------------------------
// Core service
// ---------------------------------------------------------------------------

/**
 * syncAmfiData
 *
 * Fetches the AMFI daily NAV text file, parses every mutual fund record,
 * and bulk-upserts them into the `mutual_fund_nav` table using a single
 * parameterised INSERT … ON CONFLICT statement per batch.
 *
 * AMFI file format (semicolon-delimited):
 *   Scheme Code ; ISIN Div Payout/ISIN Growth ; ISIN Reinvestment ; Scheme Name ; Net Asset Value ; Date
 *   Index:  0           1                           2                    3                4          5
 *
 * Rules applied during parsing:
 *  - Skip empty lines
 *  - Skip lines without a semicolon (header/section rows)
 *  - Skip rows where ISIN (index 1) is blank
 *  - Skip rows where NAV (index 4) is not a valid number
 */
export async function syncAmfiData(): Promise<SyncResult> {
    const startTime = Date.now();
    const amfiUrl = config.get('AMFI_NAV_URL');

    logger.info('[NavSync] Starting AMFI NAV sync', { url: amfiUrl });

    // ------------------------------------------------------------------
    // 1. Fetch the raw text file
    // ------------------------------------------------------------------
    let rawText: string;
    try {
        const response = await axios.get<string>(amfiUrl, {
            timeout: 60_000,
            responseType: 'text',
            // Force plain-text; AMFI sometimes sends with wrong content-type
            transformResponse: [(data) => data],
        });
        rawText = response.data;
        logger.info('[NavSync] Fetched AMFI file', { bytes: rawText.length });
    } catch (err) {
        logger.error('[NavSync] Failed to fetch AMFI file', { error: (err as Error).message });
        throw err;
    }

    // ------------------------------------------------------------------
    // 2. Parse
    // ------------------------------------------------------------------
    const records: NavRecord[] = [];
    let skipped = 0;

    const lines = rawText.split('\n');

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Skip blank lines and section-header lines (no semicolon)
        if (!line || !line.includes(';')) {
            skipped++;
            continue;
        }

        const parts = line.split(';');

        // Need at least 6 columns
        if (parts.length < 6) {
            skipped++;
            continue;
        }

        // Extract fields per the AMFI format spec
        const isin = parts[1].trim();
        const schemeName = parts[3].trim();
        const navRaw = parts[4].trim();
        // Strip carriage-return: AMFI uses CRLF, so parts[5] may end with \r
        const navDate = parts[5].replace(/\r/g, '').trim();

        // Skip rows with blank ISIN
        if (!isin) {
            skipped++;
            continue;
        }

        // Skip rows with an invalid NAV (e.g. "N.A.")
        const nav = parseFloat(navRaw);
        if (isNaN(nav)) {
            skipped++;
            continue;
        }

        // Skip rows whose NAV overflows decimal(10,4) — max storable is 999999.9999
        // A handful of AMFI rows carry erroneous values like 99999999
        if (nav > 999999.9999 || nav < 0) {
            skipped++;
            continue;
        }

        records.push({
            isin,
            scheme_name: schemeName,
            current_nav: nav,
            nav_date: navDate,
        });
    }

    // ------------------------------------------------------------------
    // Deduplicate by ISIN.
    //
    // The AMFI file lists some schemes more than once (e.g. growth and
    // dividend payout variants can share the same ISIN in column 1).
    // PostgreSQL's ON CONFLICT DO UPDATE refuses to touch the same row
    // twice within a single statement, so we must ensure each ISIN
    // appears at most once per batch.  We use a Map — last write wins
    // (both rows carry the same NAV/date anyway).
    // ------------------------------------------------------------------
    const dedupedMap = new Map<string, NavRecord>();
    for (const rec of records) {
        dedupedMap.set(rec.isin, rec);
    }
    const uniqueRecords = Array.from(dedupedMap.values());
    const duplicatesRemoved = records.length - uniqueRecords.length;

    logger.info('[NavSync] Parsing complete', {
        parsed: records.length,
        unique: uniqueRecords.length,
        duplicatesRemoved,
        skipped,
    });

    if (uniqueRecords.length === 0) {
        logger.warn('[NavSync] No valid records parsed — aborting upsert');
        return { parsed: 0, upserted: 0, skipped, durationMs: Date.now() - startTime };
    }

    // ------------------------------------------------------------------
    // 3. Bulk upsert in batches of BATCH_SIZE
    //
    //    We use a single parameterised INSERT … ON CONFLICT instead of
    //    individual .save() calls.  This turns 15k+ round-trips into
    //    ~15 batched statements.
    // ------------------------------------------------------------------
    let totalUpserted = 0;

    for (let i = 0; i < uniqueRecords.length; i += BATCH_SIZE) {
        const batch = uniqueRecords.slice(i, i + BATCH_SIZE);

        // Build: ($1,$2,$3,$4), ($5,$6,$7,$8), …
        const values: (string | number)[] = [];
        const placeholders = batch.map((rec, idx) => {
            const base = idx * 4;
            values.push(rec.isin, rec.scheme_name, rec.current_nav, rec.nav_date);
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, NOW())`;
        });

        const sql = `
            INSERT INTO mutual_fund_nav (isin, scheme_name, current_nav, nav_date, last_synced)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (isin) DO UPDATE SET
                scheme_name  = EXCLUDED.scheme_name,
                current_nav  = EXCLUDED.current_nav,
                nav_date     = EXCLUDED.nav_date,
                last_synced  = NOW()
        `;

        await db.query(sql, values);
        totalUpserted += batch.length;

        logger.debug('[NavSync] Batch upserted', {
            batch: Math.floor(i / BATCH_SIZE) + 1,
            rows: batch.length,
            totalSoFar: totalUpserted,
        });
    }

    const durationMs = Date.now() - startTime;

    logger.info('[NavSync] Sync complete', {
        parsed: records.length,
        upserted: totalUpserted,
        skipped,
        durationMs,
    });

    return {
        parsed: records.length,
        upserted: totalUpserted,
        skipped,
        durationMs,
    };
}
