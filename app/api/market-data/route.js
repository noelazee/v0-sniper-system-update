export async function GET(request) {
  try {
    // Fetch from Hyperliquid
    const hlResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' })
    })

    const hlData = await hlResponse.json()
    const marketData = {}

    // Process Hyperliquid data
    if (hlData && hlData[1]) {
      hlData[1].forEach((asset) => {
        if (asset && asset.name) {
          const symbol = asset.name.replace(/USDT$/i, '')
          marketData[symbol] = {
            symbol: symbol,
            price: parseFloat(asset.markPx || 0),
            change24h: 0, // Would need more data
            volume24h: parseFloat(asset.dayNtlVlm || 0),
            marketCap: parseFloat(asset.fundingRate || 0),
            fundingRate: parseFloat(asset.fundingRate || 0),
            openInterest: parseFloat(asset.openInterest || 0),
            leverage: 50 // Max leverage on Hyperliquid
          }
        }
      })
    }

    return Response.json(marketData)
  } catch (error) {
    console.error('Market data error:', error)
    return Response.json({
      BTC: { symbol: 'BTC', price: 0, change24h: 0, volume24h: 0 },
      ETH: { symbol: 'ETH', price: 0, change24h: 0, volume24h: 0 },
      SOL: { symbol: 'SOL', price: 0, change24h: 0, volume24h: 0 }
    })
  }
}
