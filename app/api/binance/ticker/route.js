export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols')

    const url = symbols
      ? `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`
      : `https://api.binance.com/api/v3/ticker/24hr`

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`Binance ${res.status}`)

    const data = await res.json()
    return Response.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
