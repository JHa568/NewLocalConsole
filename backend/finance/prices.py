"""Stock price fetching.

A small ``PriceProvider`` seam so the data source (yfinance today; Finnhub or
Alpha Vantage tomorrow) can be swapped without touching callers.
"""

from django.core.cache import cache

CACHE_TTL_SECONDS = 300  # 5 minutes — be gentle with the upstream API


class PriceProvider:
    def get_quote(self, ticker: str) -> dict:
        """Return ``{"price", "currency", "change_pct"}`` or raise."""
        raise NotImplementedError


class YFinanceProvider(PriceProvider):
    def get_quote(self, ticker: str) -> dict:
        import yfinance as yf

        t = yf.Ticker(ticker)
        info = getattr(t, "fast_info", {}) or {}
        price = info.get("last_price") or info.get("lastPrice")
        prev = info.get("previous_close") or info.get("previousClose")
        currency = info.get("currency") or "USD"

        if price is None:
            # Fall back to recent history if fast_info is unavailable.
            hist = t.history(period="1d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])

        change_pct = None
        if price is not None and prev:
            change_pct = round((float(price) - float(prev)) / float(prev) * 100, 2)

        return {
            "price": float(price) if price is not None else None,
            "currency": currency,
            "change_pct": change_pct,
        }


class FakeProvider(PriceProvider):
    """Deterministic provider for tests / E2E — no network calls."""

    def get_quote(self, ticker: str) -> dict:
        return {"price": 100.0, "currency": "AUD", "change_pct": 1.5}


def _build_provider() -> PriceProvider:
    import os

    if os.environ.get("USE_FAKE_PRICES"):
        return FakeProvider()
    return YFinanceProvider()


_provider = _build_provider()


def get_quote(ticker: str) -> dict:
    """Cached quote lookup. Never raises — returns price=None on failure so the
    rest of the dashboard still renders."""
    ticker = ticker.strip().upper()
    cache_key = f"quote:{ticker}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        quote = _provider.get_quote(ticker)
    except Exception:
        quote = {"price": None, "currency": None, "change_pct": None}
    cache.set(cache_key, quote, CACHE_TTL_SECONDS)
    return quote
