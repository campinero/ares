import Dexie, { type Table } from 'dexie'
import type { StateStorage } from 'zustand/middleware'

/**
 * Analyst work product persistence.
 *
 * The evidence set itself is immutable and lives in code. Only what the
 * investigator authors - hypotheses, custody entries, notes, review flags and
 * report configuration - is written to IndexedDB, so a reload resumes the
 * investigation exactly where it left off.
 */

interface KvRow {
  key: string
  value: string
}

class AresDb extends Dexie {
  kv!: Table<KvRow, string>

  constructor() {
    super('ares-case-file')
    this.version(1).stores({ kv: '&key' })
  }
}

export const db = new AresDb()

/** zustand storage adapter backed by Dexie. Falls back silently when blocked. */
export const dexieStorage: StateStorage = {
  async getItem(name) {
    try {
      const row = await db.kv.get(name)
      return row?.value ?? null
    } catch {
      return null
    }
  },
  async setItem(name, value) {
    try {
      await db.kv.put({ key: name, value })
    } catch {
      /* private mode or quota - the session still works, it just will not resume */
    }
  },
  async removeItem(name) {
    try {
      await db.kv.delete(name)
    } catch {
      /* ignore */
    }
  },
}

export async function clearPersistedCase(): Promise<void> {
  try {
    await db.kv.clear()
  } catch {
    /* ignore */
  }
}
