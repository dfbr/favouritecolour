/**
 * algorithms.js
 * Ranking algorithms for the Favourite Colour app.
 *
 * Two algorithms are provided:
 *
 *  TennisLadder — Bottom-up merge sort. Each colour "challenges" others
 *                 to climb the ladder. O(n log n) comparisons.
 *
 *  ChessRanking — Elo rating system. Colours start at 1500; each
 *                 comparison updates ratings. Pairs chosen to maximise
 *                 information (closest ratings first).
 *
 * Both classes share the same interface:
 *   new Cls(colours, state?)  — create or restore
 *   .currentPair()            → {a, b} | null (null when complete)
 *   .recordChoice(winnerId)   — register user's preference
 *   .getRanking()             → [{colour, rank, …}, …] best-first
 *   .estimatedTotal()         → number  (approx total comparisons)
 *   .toJSON()                 → plain object (for localStorage)
 */

/* ── Utility ─────────────────────────────────── */

/** Fisher-Yates shuffle (in-place). Returns the array. */
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ══════════════════════════════════════════════
   TENNIS LADDER  —  Bottom-up Merge Sort
   ══════════════════════════════════════════════
   The "ladder" is a queue of sorted runs.
   We always take the first two runs and merge them
   (user decides each comparison), pushing the result
   to the back. This naturally performs a bottom-up
   merge sort in O(n log n) comparisons. */

class TennisLadder {
  /**
   * @param {object[]|null} colours  Colour objects; null when restoring
   * @param {object|null}   state    Saved toJSON() output; null for new session
   */
  constructor(colours, state = null) {
    if (state) {
      /* Restore all fields from saved state */
      this.colours     = state.colours;
      this.comparisons = state.comparisons;
      this.complete    = state.complete;
      this.runs        = state.runs;
      this.mergeA      = state.mergeA;
      this.mergeB      = state.mergeB;
      this.mergeResult = state.mergeResult || [];
      this.aiIdx       = state.aiIdx;
      this.biIdx       = state.biIdx;
      this._sorted     = state._sorted || null;
    } else {
      /* New session: shuffle colours and initialise merge state */
      this.colours     = _shuffle([...colours]);
      this.comparisons = 0;
      this.complete    = false;
      /* Queue of sorted sub-arrays (runs) awaiting merging */
      this.runs        = this.colours.map(c => [c]);
      this.mergeA      = null;
      this.mergeB      = null;
      this.mergeResult = [];
      this.aiIdx       = 0;
      this.biIdx       = 0;
      this._sorted     = null;
      /* Pop first two runs to begin the first merge */
      this._startNextMerge();
    }
  }

  /* ── Private helpers ───────────────────────── */

  /** Flush any remaining elements from the active merge into the result,
   *  push the completed run to the queue, then start the next merge. */
  _finishCurrentMerge() {
    /* Consume rest of whichever side has elements left */
    while (this.aiIdx < this.mergeA.length) {
      this.mergeResult.push(this.mergeA[this.aiIdx++]);
    }
    while (this.biIdx < this.mergeB.length) {
      this.mergeResult.push(this.mergeB[this.biIdx++]);
    }
    /* Push completed sorted run to the back of the queue */
    this.runs.push([...this.mergeResult]);
    this.mergeA      = null;
    this.mergeB      = null;
    this.mergeResult = [];
    this.aiIdx       = 0;
    this.biIdx       = 0;
  }

  /** Take the next two runs from the queue and prepare a merge. */
  _startNextMerge() {
    if (this.runs.length <= 1) {
      /* Only one run left — sorting is complete */
      this._sorted  = this.runs[0] || [];
      this.complete = true;
      return;
    }
    this.mergeA      = this.runs.shift();
    this.mergeB      = this.runs.shift();
    this.mergeResult = [];
    this.aiIdx       = 0;
    this.biIdx       = 0;
  }

  /* ── Public interface ──────────────────────── */

  /**
   * Return the current pair to present to the user.
   * Advances past any exhausted merges automatically.
   * @returns {{a: object, b: object}|null}
   */
  currentPair() {
    if (this.complete) return null;

    /* Advance through any merges where one side is already exhausted */
    while (!this.complete) {
      if (
        this.mergeA &&
        this.aiIdx < this.mergeA.length &&
        this.biIdx < this.mergeB.length
      ) {
        return { a: this.mergeA[this.aiIdx], b: this.mergeB[this.biIdx] };
      }
      /* Current merge is done on (at least) one side — finish it */
      if (this.mergeA) this._finishCurrentMerge();
      this._startNextMerge();
    }
    return null;
  }

  /**
   * Record that the user preferred the colour with the given id.
   * @param {string} winnerId
   */
  recordChoice(winnerId) {
    if (this.complete) return;
    const pair = this.currentPair();
    if (!pair) return;

    this.comparisons++;
    if (winnerId === pair.a.id) {
      this.mergeResult.push(this.mergeA[this.aiIdx++]);
    } else {
      this.mergeResult.push(this.mergeB[this.biIdx++]);
    }
  }

  /**
   * Return the current ranking, best colour first.
   * While in progress, returns a best-effort partial ranking.
   * @returns {Array<{colour: object, rank: number}>}
   */
  getRanking() {
    if (this.complete) {
      return this._sorted.map((c, i) => ({ colour: c, rank: i + 1 }));
    }
    /* Partial ranking: completed merge result first, then unseen colours */
    const partial = [
      ...this.mergeResult,
      ...(this.mergeA ? this.mergeA.slice(this.aiIdx) : []),
      ...(this.mergeB ? this.mergeB.slice(this.biIdx) : []),
      ...this.runs.flat(),
    ];
    return partial.map((c, i) => ({ colour: c, rank: i + 1 }));
  }

  /** Estimated total number of comparisons (O(n log n)). */
  estimatedTotal() {
    const n = this.colours.length;
    return Math.ceil(n * Math.log2(Math.max(n, 2)));
  }

  /** Serialise state for localStorage. */
  toJSON() {
    return {
      colours:     this.colours,
      comparisons: this.comparisons,
      complete:    this.complete,
      runs:        this.runs,
      mergeA:      this.mergeA,
      mergeB:      this.mergeB,
      mergeResult: this.mergeResult,
      aiIdx:       this.aiIdx,
      biIdx:       this.biIdx,
      _sorted:     this._sorted,
    };
  }
}

/* ══════════════════════════════════════════════
   CHESS RANKING  —  Elo Rating System
   ══════════════════════════════════════════════
   Every colour starts at rating 1500. After each
   comparison the Elo formula adjusts both colours'
   ratings. The next pair is selected to maximise
   information: prioritise colours with fewest
   comparisons, then those with closest ratings. */

/* Elo K-factor: controls how much ratings shift per comparison.
 * Higher values mean faster convergence but more volatility. */
const ELO_K            = 32;
/* Initial rating assigned to every colour. */
const ELO_INITIAL      = 1500;
/* Divisor used in the expected-score formula (standard Elo scale). */
const ELO_SCALE        = 400;

class ChessRanking {
  /**
   * @param {object[]|null} colours  Colour objects; null when restoring
   * @param {object|null}   state    Saved toJSON() output; null for new session
   */
  constructor(colours, state = null) {
    if (state) {
      this.colours      = state.colours;
      this.comparisons  = state.comparisons;
      this.complete     = state.complete;
      this.ratings      = state.ratings;
      this.compCounts   = state.compCounts;
      this.history      = state.history || [];
      this._currentPair = state._currentPair;
    } else {
      this.colours     = _shuffle([...colours]); /* randomise per session */
      this.comparisons = 0;
      this.complete    = false;
      this.ratings     = {};
      this.compCounts  = {};
      this.history     = [];

      /* Initialise every colour with the starting Elo rating */
      for (const c of colours) {
        this.ratings[c.id]    = ELO_INITIAL;
        this.compCounts[c.id] = 0;
      }
      this._currentPair = this._selectPair();
    }
  }

  /* ── Private helpers ───────────────────────── */

  /** Minimum comparisons required per colour before declaring completion. */
  _minRequired() {
    return Math.max(3, Math.ceil(Math.log2(this.colours.length)));
  }

  /**
   * Choose the most informative next pair.
   * Strategy: anchor = colour with fewest comparisons; opponent = closest rating.
   * @returns {{a: object, b: object}|null}
   */
  _selectPair() {
    const n = this.colours.length;
    if (n < 2) return null;

    const minReq = this._minRequired();
    /* Check stopping criterion: every colour has been compared enough */
    const minCompsSoFar = Math.min(...this.colours.map(c => this.compCounts[c.id]));
    if (minCompsSoFar >= minReq) return null;

    /* Pick the colour with the fewest comparisons as the "anchor" */
    const sorted = [...this.colours].sort(
      (a, b) => this.compCounts[a.id] - this.compCounts[b.id]
    );
    const anchor = sorted[0];

    /* Among the others, find the one with the closest Elo rating */
    const others = this.colours.filter(c => c.id !== anchor.id);
    others.sort((a, b) => {
      const da = Math.abs(this.ratings[a.id] - this.ratings[anchor.id]);
      const db = Math.abs(this.ratings[b.id] - this.ratings[anchor.id]);
      return da - db;
    });

    return { a: anchor, b: others[0] };
  }

  /* ── Public interface ──────────────────────── */

  /** @returns {{a: object, b: object}|null} */
  currentPair() {
    return this._currentPair;
  }

  /**
   * Record that the user preferred the colour with the given id,
   * update Elo ratings, and select the next pair.
   * @param {string} winnerId
   */
  recordChoice(winnerId) {
    const pair = this._currentPair;
    if (!pair) return;

    const a      = pair.a;
    const b      = pair.b;
    const rA     = this.ratings[a.id];
    const rB     = this.ratings[b.id];
    /* Expected scores */
    const eA     = 1 / (1 + Math.pow(10, (rB - rA) / ELO_SCALE));
    const eB     = 1 - eA;
    /* Actual scores */
    const sA     = winnerId === a.id ? 1 : 0;
    const sB     = 1 - sA;

    this.ratings[a.id] += ELO_K * (sA - eA);
    this.ratings[b.id] += ELO_K * (sB - eB);

    this.compCounts[a.id]++;
    this.compCounts[b.id]++;
    this.comparisons++;

    /* Record for debug / history */
    this.history.push({ winnerId, loserId: sA ? b.id : a.id });

    /* Select next pair; mark complete if none available */
    this._currentPair = this._selectPair();
    if (!this._currentPair) this.complete = true;
  }

  /**
   * Return colours ranked by Elo rating, highest (most-preferred) first.
   * @returns {Array<{colour: object, rank: number, rating: number}>}
   */
  getRanking() {
    return [...this.colours]
      .sort((a, b) => this.ratings[b.id] - this.ratings[a.id])
      .map((c, i) => ({ colour: c, rank: i + 1, rating: Math.round(this.ratings[c.id]) }));
  }

  /** Estimated total comparisons: n × minRequired. */
  estimatedTotal() {
    return this.colours.length * this._minRequired();
  }

  /** Serialise state for localStorage. */
  toJSON() {
    return {
      colours:      this.colours,
      comparisons:  this.comparisons,
      complete:     this.complete,
      ratings:      this.ratings,
      compCounts:   this.compCounts,
      history:      this.history,
      _currentPair: this._currentPair,
    };
  }
}
