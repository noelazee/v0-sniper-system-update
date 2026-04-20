export async function POST(request) {
  try {
    const body = await request.json()
    const { address, positionId } = body

    if (!address || !positionId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get position details
    const infoResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address
      })
    })

    const userData = await infoResponse.json()
    
    // Find position
    const positions = userData.assetPositions || []
    const position = positions[parseInt(positionId.split('-')[1])]
    
    if (!position || !position.position) {
      throw new Error('Position not found')
    }

    const posData = position.position
    const size = Math.abs(parseFloat(posData.szi))
    const isBuy = parseFloat(posData.szi) < 0 // Close long = sell, close short = buy

    // Close position with market order
    const closeResponse = await fetch('https://api.hyperliquid.xyz/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order',
        orders: [{
          asset: position.assetId,
          isBuy: isBuy,
          limitPx: 0, // Market order
          sz: size,
          orderType: 'Market',
          timeInForce: 'Ioc',
          reduceOnly: true // Close only
        }],
        grouping: 'na'
      })
    })

    if (!closeResponse.ok) {
      throw new Error('Failed to close position')
    }

    return Response.json({
      success: true,
      message: `Position closed successfully`,
      closedSize: size
    })
  } catch (error) {
    console.error('Close position error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
