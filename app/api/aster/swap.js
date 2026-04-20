export async function POST(request) {
  try {
    const body = await request.json()
    const { address, tokenIn, tokenOut, amount, slippage = 0.5 } = body

    if (!address || !tokenIn || !tokenOut || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Aster DEX API endpoints
    const aster_api = 'https://api.asterdex.io/v1'

    // Get quote for swap
    const quoteResponse = await fetch(`${aster_api}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amount.toString(),
        slippage: slippage
      })
    })

    if (!quoteResponse.ok) {
      throw new Error('Failed to get swap quote')
    }

    const quote = await quoteResponse.json()

    // Execute swap
    const swapResponse = await fetch(`${aster_api}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: address,
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amount.toString(),
        minAmountOut: quote.amountOut * (1 - slippage / 100),
        slippage: slippage,
        deadline: Math.floor(Date.now() / 1000) + 300 // 5 min deadline
      })
    })

    if (!swapResponse.ok) {
      throw new Error('Swap execution failed')
    }

    const swapResult = await swapResponse.json()

    const response = {
      success: true,
      swap: {
        id: swapResult.txHash || Math.random().toString(36).substr(2, 9),
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amount,
        amountOut: quote.amountOut,
        price: quote.price,
        priceImpact: quote.priceImpact,
        fee: quote.fee,
        status: 'submitted',
        timestamp: new Date().toISOString(),
        txHash: swapResult.txHash
      },
      message: `Swap ${amount} ${tokenIn} → ${quote.amountOut} ${tokenOut} executed`
    }

    console.log('Swap executed on Aster DEX:', response)

    return Response.json(response)
  } catch (error) {
    console.error('Aster DEX swap error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
