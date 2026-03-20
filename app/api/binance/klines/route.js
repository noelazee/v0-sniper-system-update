const COINGECKO_IDS = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  SOLUSDT: 'solana',
  BNBUSDT: 'binancecoin',
}

function geckoToKlines(data) {
  return data.map(([t, o, h, l, c]) => [
    t, String(o), String(h), String(l), String(c),
    '0', t + 60000, '0', '0', '0', '0', '0',
  ])
}

function intervalToDays(interval) {
  const map = { '1m':1, '5m':1, '15m':1, '30m':1, '1h':1, '4h':7, '1d':30 }
  return map[interval] || 1
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const symbol   = searchParams.get('symbol')   || 'BTCUSDT'
  const interval = searchParams.get('interval') || '15m'
  const limit    = parseInt(searchParams.get('limit') || '100')

  
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return Response.json(data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
            'X-Source': 'binance',
          },
        })
      }
    }
  } catch (err) {
    console.warn('[klines] Binance failed:', err.message)
  }

  
  try {
    const geckoId = COINGECKO_IDS[symbol.toUpperCase()]
    if (!geckoId) throw new Error(`No CoinGecko ID for ${symbol}`)

    const days = intervalToDays(interval)
    const res  = await fetch(
      `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`)

    const raw  = await res.json()
    if (!Array.isArray(raw) || !raw.length) throw new Error('Empty response')

    const data = geckoToKlines(raw.slice(-limit))

    return Response.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'X-Source': 'coingecko',
      },
    })
  } catch (err) {
    console.error('[klines] Both failed:', err.message)
    return Response.json({ error: 'Chart data unavailable' }, { status: 503 })
  }
}
