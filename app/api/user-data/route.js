export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const address = url.searchParams.get('address')

    if (!address) {
      return Response.json({ error: 'Address required' }, { status: 400 })
    }

    // Fetch from Hyperliquid
    const hlResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address
      })
    })

    const hlData = hlResponse.ok ? await hlResponse.json() : null

    // Fetch from Aster DEX
    const asterResponse = await fetch(`https://api.asterdex.io/v1/user/${address}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const asterData = asterResponse.ok ? await asterResponse.json() : null

    // Parse positions from Hyperliquid
    const positions = []
    if (hlData?.assetPositions && Array.isArray(hlData.assetPositions)) {
      hlData.assetPositions.forEach((pos, idx) => {
        try {
          if (pos?.position && parseFloat(pos.position.szi) !== 0) {
            positions.push({
              id: `pos-${idx}`,
              symbol: pos.position.coin || 'UNKNOWN',
              side: parseFloat(pos.position.szi) > 0 ? 'long' : 'short',
              size: Math.abs(parseFloat(pos.position.szi || 0)),
              entryPrice: parseFloat(pos.position.entryPx || 0),
              markPrice: parseFloat(pos.position.markPx || 0),
              leverage: parseFloat(pos.position.leverage || 1),
              pnl: parseFloat(pos.position.unrealizedPnl || 0),
              pnlPercent: parseFloat(pos.position.returnOnEquity || 0) * 100
            })
          }
        } catch (e) {
          console.error('Error parsing position:', e)
        }
      })
    }

    // Parse open orders from Hyperliquid
    const orders = []
    if (hlData?.openOrders) {
      hlData.openOrders.forEach((order, idx) => {
        orders.push({
          id: order.oid?.toString() || `order-${idx}`,
          symbol: order.coin,
          side: order.limitPx > 0 ? 'buy' : 'sell',
          size: parseFloat(order.sz),
          price: Math.abs(parseFloat(order.limitPx)),
          status: 'open',
          timestamp: new Date(parseInt(order.timestamp)).toISOString()
        })
      })
    }

    // Calculate total balance
    let balance = 0
    if (hlData?.marginSummary) {
      balance = parseFloat(hlData.marginSummary.accountValue) || 0
    }

    const userData = {
      address: address,
      balance: balance,
      positions: positions,
      orders: orders,
      portfolio: {
        totalValue: balance,
        totalPnL: positions.reduce((sum, p) => sum + (p.pnl || 0), 0),
        totalPnLPercent: (positions.reduce((sum, p) => sum + (p.pnl || 0), 0) / balance * 100) || 0
      }
    }

    return Response.json(userData)
  } catch (error) {
    console.error('User data error:', error)
    return Response.json({
      address: searchParams.get('address'),
      balance: 0,
      positions: [],
      orders: [],
      portfolio: { totalValue: 0, totalPnL: 0, totalPnLPercent: 0 },
      error: error.message
    })
  }
}
