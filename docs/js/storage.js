/**
 * storage.js
 * Persistence layer using browser localStorage.
 *
 * All session data is stored under a single key as a JSON blob containing:
 *   session    — metadata (palette, method, startedAt, complete)
 *   rankerState — serialised algorithm state (from ranker.toJSON())
 *   savedAt    — timestamp of last save
 */

const STORAGE_KEY = 'favourite-colour-v1';

const Storage = {
  /**
   * Persist the current session and ranking state.
   * @param {object} session  Session metadata object
   * @param {object} ranker   TennisLadder or ChessRanking instance
   */
  save(session, ranker) {
    try {
      const data = {
        session,
        rankerState: ranker.toJSON(),
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      /* localStorage may be unavailable (private browsing, quota exceeded) */
      console.warn('[storage] Could not save session:', err);
    }
  },

  /**
   * Load the last saved session, or null if none / parse error.
   * @returns {{session: object, rankerState: object, savedAt: number}|null}
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[storage] Could not load session:', err);
      return null;
    }
  },

  /** Remove all saved session data. */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) { /* ignore */ }
  },
};
