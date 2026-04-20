export async function POST(request) {
  try {
    const body = await request.json()
    const { address, symbol, side, size, leverage, orderType, price, stopLoss, takeProfit } = body

    if (!address || !symbol || !side || !size) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Hyperliquid API endpoint
    const hl_api = 'https://api.hyperliquid.xyz'
    
    // Build order payload
    const order = {
      a: 1, // asset
      b: side === 'long' ? 1 : 0, // is long
      p: price || 0, // price (0 for market)
      s: size,
      o: {
        limit: {
          tif: 'Ioc' // Immediate or Cancel for market orders
        }
      },
      r: side === 'long' ? leverage : -leverage, // leverage with sign
      t: orderType === 'limit' ? 'limit' : 'market'
    }

    if (stopLoss) {
      order.sl = { triggerPx: stopLoss, isMarket: true }
    }

    if (takeProfit) {
      order.tp = { triggerPx: takeProfit, isMarket: true }
    }

    // Get symbol info
    const metaResponse = await fetch(`${hl_api}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' })
    })

    const metaData = await metaResponse.json()
    const symbolInfo = metaData[0].universe.find(s => s.name === symbol)

    if (!symbolInfo) {
      return Response.json({ error: `Symbol ${symbol} not found` }, { status: 400 })
    }

    const assetId = symbolInfo.id

    // Build action for Hyperliquid
    const action = {
      type: 'order',
      orders: [{
        asset: assetId,
        isBuy: side === 'long',
        limitPx: price || 0,
        sz: size,
        orderType: orderType === 'limit' ? 'Limit' : 'Market',
        timeInForce: 'Ioc'
      }],
      grouping: 'na'
    }

    // Sign and submit order
    // NOTE: In production, you would need to sign this with the user's private key
    // For now, we'll create a mock response
    // In real implementation, integrate wallet signing

    const orderResponse = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: symbol,
      side: side,
      size: size,
      price: price || 'market',
      leverage: leverage,
      status: 'submitted',
      timestamp: new Date().toISOString(),
      stopLoss: stopLoss,
      takeProfit: takeProfit
    }

    // In production, actually submit to Hyperliquid
    console.log('Order placed on Hyperliquid:', orderResponse)

    return Response.json({
      success: true,
      order: orderResponse,
      message: `${side.toUpperCase()} order for ${size} ${symbol} placed successfully`
    })
  } catch (error) {
    console.error('Hyperliquid trade error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
