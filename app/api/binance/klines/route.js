export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol   = searchParams.get('symbol')   || 'BTCUSDT'
    const interval = searchParams.get('interval') || '15m'
    const limit    = searchParams.get('limit')    || '100'

    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { cache: 'no-store' }
    )

    if (!res.ok) throw new Error('Binance API error')

    const data = await res.json()

    return Response.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
