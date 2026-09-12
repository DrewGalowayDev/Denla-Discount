/**
 * Denla Discount — Shared API Helper
 * 
 * Provides:
 *  - In-memory response cache (5 min TTL) to cut redundant GET requests
 *  - Request deduplication (simultaneous identical GETs share one fetch)
 *  - Smart 429 retry with exponential back-off + Retry-After header support
 *  - Consistent auth-header injection for authenticated calls
 * 
 * Usage:
 *   const data = await window.api.get('/api/products?limit=50');
 *   const result = await window.api.post('/api/auth/login', { email, password });
 */

(function (global) {
    'use strict';

    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    const _cache = new Map();
    const _inFlight = new Map();

    // ── Cache helpers ─────────────────────────────────────────────────────────

    function _getCached(url) {
        const entry = _cache.get(url);
        if (!entry) return null;
        if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(url); return null; }
        return entry.data; // Returns the parsed JSON directly
    }

    function _setCached(url, data) {
        _cache.set(url, { data, ts: Date.now() });
    }

    /** Manually invalidate a cached URL or a URL prefix */
    function invalidate(urlOrPrefix) {
        for (const key of _cache.keys()) {
            if (key.startsWith(urlOrPrefix)) _cache.delete(key);
        }
    }

    // ── Core fetch wrapper ────────────────────────────────────────────────────

    async function _request(url, options, maxAttempts, baseDelay) {
        options = options || {};
        maxAttempts = maxAttempts || 3;
        baseDelay = baseDelay || 500;

        const method = (options.method || 'GET').toUpperCase();
        const isGet = method === 'GET';

        // Auth header injection
        const token = localStorage.getItem('token');
        const headers = Object.assign(
            { 'Content-Type': 'application/json' },
            token ? { 'Authorization': 'Bearer ' + token } : {},
            options.headers || {}
        );

        const fetchOptions = Object.assign({}, options, { method: method, headers: headers });
        if (options.body && typeof options.body !== 'string') {
            fetchOptions.body = JSON.stringify(options.body);
        }

        // Cache + deduplication for GET requests
        if (isGet) {
            const cached = _getCached(url);
            if (cached !== null) return { ok: true, data: cached, fromCache: true };

            if (_inFlight.has(url)) {
                return _inFlight.get(url);
            }
        }

        const promise = (async () => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const resp = await fetch(url, fetchOptions);

                    if (resp.ok) {
                        const contentType = resp.headers.get('content-type') || '';
                        let data = null;
                        if (contentType.includes('application/json')) {
                            data = await resp.json();
                        } else {
                            data = await resp.text();
                        }
                        if (isGet) _setCached(url, data);
                        return { ok: true, status: resp.status, data: data };
                    }

                    if (resp.status === 429) {
                        const retryAfter = resp.headers.get('Retry-After');
                        const delay = retryAfter
                            ? parseInt(retryAfter) * 1000
                            : baseDelay * Math.pow(2, attempt - 1);
                        console.warn('[api] 429 on ' + url + '. Waiting ' + delay + 'ms (attempt ' + attempt + '/' + maxAttempts + ')');
                        if (attempt < maxAttempts) {
                            await new Promise(function(r) { setTimeout(r, delay); });
                            continue;
                        }
                    }

                    // Non-retryable error
                    let errorData = null;
                    try { errorData = await resp.json(); } catch (e) {}
                    return { ok: false, status: resp.status, data: errorData, error: (errorData && errorData.message) || resp.statusText };

                } catch (networkError) {
                    console.warn('[api] Network error on ' + url + ' (attempt ' + attempt + '/' + maxAttempts + '):', networkError);
                    if (attempt < maxAttempts) {
                        await new Promise(function(r) { setTimeout(r, baseDelay * Math.pow(2, attempt - 1)); });
                    } else {
                        return { ok: false, status: 0, error: networkError.message };
                    }
                }
            }
            return { ok: false, status: 0, error: 'Max retries exceeded' };
        })();

        if (isGet) {
            _inFlight.set(url, promise);
            try {
                return await promise;
            } finally {
                _inFlight.delete(url);
            }
        }

        return promise;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    var api = {
        get: function(url, options) { return _request(url, Object.assign({}, options, { method: 'GET' })); },
        post: function(url, body, options) { return _request(url, Object.assign({}, options, { method: 'POST', body: body })); },
        put: function(url, body, options) { return _request(url, Object.assign({}, options, { method: 'PUT', body: body })); },
        delete: function(url, options) { return _request(url, Object.assign({}, options, { method: 'DELETE' })); },
        patch: function(url, body, options) { return _request(url, Object.assign({}, options, { method: 'PATCH', body: body })); },
        invalidate: invalidate,
        clearCache: function() { _cache.clear(); }
    };

    global.api = api;
})(window);
