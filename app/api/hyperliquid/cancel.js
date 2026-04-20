export async function POST(request) {
  try {
    const body = await request.json()
    const { address, orderId } = body

    if (!address || !orderId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Cancel order on Hyperliquid
    const cancelResponse = await fetch('https://api.hyperliquid.xyz/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cancel',
        cancels: [{
          orderId: orderId,
          coin: '' // Will be determined by Hyperliquid
        }]
      })
    })

    if (!cancelResponse.ok) {
      throw new Error('Failed to cancel order')
    }

    return Response.json({
      success: true,
      message: `Order ${orderId} cancelled successfully`
    })
  } catch (error) {
    console.error('Cancel order error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
