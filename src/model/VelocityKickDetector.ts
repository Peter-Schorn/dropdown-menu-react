type KickResult = {
    /** True only on the transition when a kick is detected. */
    isKickStart: boolean;
    /** Instantaneous velocity (abs(deltaY) / dtMs). */
    v: number;
    /** Clamped delta time in ms. */
    dtMs: number;
    /** Slow baseline velocity. */
    baseline: number;
    /** Decaying peak envelope. */
    envelope: number;
    /** v - envelope (for debugging). */
    excess: number;
    /** Current qualifying streak length. */
    streak: number;
};

type VelocityKickDetectorOptions = {
    /** Ignore tiny dt jitter. */
    minDtMs?: number;
    /** Treat large gaps as a new episode. */
    maxDtMs?: number;

    /** Minimum velocity to even consider a kick. */
    minVelocity?: number;

    /**
     * Fractional excess required over the envelope.
     * Example: 0.45 means v must be 45% above envelope.
     */
    minExcessRatio?: number;

    /**
     * Absolute excess floor (useful when envelope is small).
     */
    minExcessAbs?: number;

    /** Consecutive qualifying samples required. */
    requiredStreak?: number;

    /** Slow baseline time constant in ms. */
    baselineTauMs?: number;

    /** Envelope decay time constant in ms. */
    envelopeTauMs?: number;
};

/**
 * An event type compatible with VelocityKickDetector.
 */
export type VelocityKickDetectorCompatibleEvent = {
    deltaY: number;
    timeStamp: number;
};

export class VelocityKickDetector {
    private readonly minDtMs: number;
    private readonly maxDtMs: number;
    private readonly minVelocity: number;
    private readonly minExcessRatio: number;
    private readonly minExcessAbs: number;
    private readonly requiredStreak: number;
    private readonly baselineTauMs: number;
    private readonly envelopeTauMs: number;

    private baseline: number = 0;
    private envelope: number = 0;
    private streak: number = 0;
    private inKick: boolean = false;
    private lastTs: number | null = null;

    public constructor(options: VelocityKickDetectorOptions = {}) {
        this.minDtMs = options.minDtMs ?? 2;
        this.maxDtMs = options.maxDtMs ?? 100;

        this.minVelocity = options.minVelocity ?? 0.1;

        this.minExcessRatio = options.minExcessRatio ?? 0.05;
        this.minExcessAbs = options.minExcessAbs ?? 0.05;

        this.requiredStreak = options.requiredStreak ?? 2;

        this.baselineTauMs = options.baselineTauMs ?? 100;
        this.envelopeTauMs = options.envelopeTauMs ?? 100;
    }

    /** Resets all internal state. */
    public reset(): void {
        this.baseline = 0;
        this.envelope = 0;
        this.streak = 0;
        this.inKick = false;
        this.lastTs = null;
    }

    /**
     * Update the detector with a new event.
     */
    public updateWithEvent(
        event: VelocityKickDetectorCompatibleEvent
    ): KickResult {
        return this.update(event.deltaY, event.timeStamp);
    }

    /**
     * Update the detector with raw deltaY and timestamp.
     */
    public update(deltaY: number, timeStampMs: number): KickResult {
        const absDeltaY = Math.abs(deltaY);

        if (this.lastTs === null) {
            this.lastTs = timeStampMs;
            this.baseline = 0;
            this.envelope = 0;

            return {
                isKickStart: false,
                v: 0,
                dtMs: 0,
                baseline: this.baseline,
                envelope: this.envelope,
                excess: 0,
                streak: this.streak,
            };
        }

        let dtMs = timeStampMs - this.lastTs;
        this.lastTs = timeStampMs;

        if (dtMs < this.minDtMs) {
            dtMs = this.minDtMs;
        }

        if (dtMs > this.maxDtMs) {
            // long pause → new episode
            const vReset = absDeltaY / dtMs;
            this.baseline = vReset;
            this.envelope = vReset;
            this.streak = 0;
            this.inKick = false;

            return {
                isKickStart: false,
                v: vReset,
                dtMs,
                baseline: this.baseline,
                envelope: this.envelope,
                excess: 0,
                streak: this.streak,
            };
        }

        // instantaneous velocity (px/ms)
        const v = absDeltaY / dtMs;

        // fast, cheap time-aware smoothing factors
        const aBase = dtMs / (this.baselineTauMs + dtMs);
        const aEnv = dtMs / (this.envelopeTauMs + dtMs);

        // baseline: slow ema
        this.baseline += aBase * (v - this.baseline);

        // envelope: rise quickly to peaks, decay conservatively toward baseline
        if (v > this.envelope) {
            this.envelope += aEnv * (v - this.envelope);
        } else {
            this.envelope += aEnv * (this.baseline - this.envelope);
        }

        // kick qualification thresholds
        const ratioThreshold = this.envelope * (1 + this.minExcessRatio);
        const absThreshold = this.envelope + this.minExcessAbs;
        const threshold = Math.max(ratioThreshold, absThreshold);

        const qualifies =
            v >= this.minVelocity &&
            v >= threshold;

        if (qualifies) {
            this.streak += 1;
        } else {
            this.streak = 0;
            this.inKick = false;
        }

        const isKickStart = !this.inKick && this.streak >= this.requiredStreak;
        if (isKickStart) {
            this.inKick = true;
        }

        return {
            isKickStart,
            v,
            dtMs,
            baseline: this.baseline,
            envelope: this.envelope,
            excess: v - this.envelope,
            streak: this.streak,
        };
    }
}
