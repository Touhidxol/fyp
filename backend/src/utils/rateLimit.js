const hits = new Map(); // key -> timestamps (ms) inside the window

// Returns 0 if the call is allowed (and records it),
// otherwise the number of seconds to wait.
export const hitLimit = (key, limit, windowMs) => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= limit) {
        hits.set(key, recent);
        return Math.ceil((recent[0] + windowMs - now) / 1000);
    }

    recent.push(now);
    hits.set(key, recent);
    return 0;
};