import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.BLUE_MINDS_API_KEY || 'sk-placeholder',
  baseURL: 'https://api.bluesminds.com/v1',
})

// Agent-specific system prompt template
const createAgentSystemPrompt = (userStrategy) => `
You are an autonomous crypto trading agent with access to Hyperliquid (perpetuals) and Aster DEX (spot trading).

USER STRATEGY:
${userStrategy}

AVAILABLE ACTIONS:
1. PERP: Open/close perpetual positions on Hyperliquid
   - LONG_PERP [symbol] [size] [leverage] @ [price] SL:[stopLoss] TP:[takeProfit]
   - SHORT_PERP [symbol] [size] [leverage] @ [price] SL:[stopLoss] TP:[takeProfit]
   - CLOSE_PERP [symbol] [percent]

2. SPOT: Execute spot trades on Aster DEX
   - BUY_SPOT [tokenIn] [amount] → [tokenOut]
   - SELL_SPOT [token] [amount] → [tokenOut]
   - SWAP_SPOT [tokenIn] [amount] → [tokenOut]

3. ANALYSIS:
   - GET_PRICE [symbol]
   - GET_POSITIONS
   - GET_BALANCE
   - GET_SIGNALS

EXECUTION RULES:
- Only execute when analysis confirms the strategy
- Risk management: Never exceed 5% account risk per trade
- Position sizing: Scale into strong setups
- Stop losses are mandatory on all positions
- Cancel orders if market conditions change
- Report all executed trades immediately

OUTPUT FORMAT:
When executing a trade, respond with:
ACTION: [action type]
SYMBOL: [symbol]
TYPE: [PERP|SPOT]
SIZE: [amount]
ENTRY: [price]
STOP_LOSS: [price]
TAKE_PROFIT: [price]
REASONING: [brief explanation]

Current market conditions and available data will be provided. Respond with actionable trades or "WAIT" if conditions don't match strategy.
`

export async function POST(request) {
  try {
    const { action, agentStrategy, marketData, currentPositions, userAddress } = await request.json()

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 })
    }

    if (action === 'analyze') {
      // Get AI analysis based on user strategy
      if (!agentStrategy) {
        return Response.json({ error: 'Missing agentStrategy' }, { status: 400 })
      }

      const systemPrompt = createAgentSystemPrompt(agentStrategy)

      const enrichedPrompt = `
Market Data:
${JSON.stringify(marketData, null, 2)}

Current Positions:
${JSON.stringify(currentPositions, null, 2)}

Analyze the market and provide the next action based on the strategy above.
`

      const response = await client.chat.completions.create({
        model: 'deepseek-v3.2',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enrichedPrompt },
        ],
      })

      const content = response.choices[0].message.content
      const tradingAction = parseTradingAction(content)

      return Response.json({
        analysis: content,
        action: tradingAction,
        timestamp: new Date().toISOString(),
      })
    }

    if (action === 'execute') {
      // Execute the trading action
      const { tradeAction, type } = await request.json()

      if (!tradeAction) {
        return Response.json({ error: 'Missing tradeAction' }, { status: 400 })
      }

      let result

      if (type === 'PERP') {
        // Execute Hyperliquid perpetual trade
        result = await executePerpTrade(tradeAction, userAddress)
      } else if (type === 'SPOT') {
        // Execute Aster DEX spot trade
        result = await executeSpotTrade(tradeAction, userAddress)
      } else {
        return Response.json({ error: 'Invalid trade type' }, { status: 400 })
      }

      return Response.json({
        success: result.success,
        txHash: result.txHash,
        details: result.details,
        timestamp: new Date().toISOString(),
      })
    }

    if (action === 'backtest') {
      // Run backtest on strategy
      const { agentStrategy, historicalData } = await request.json()

      const backtestPrompt = `
Given this trading strategy:
${agentStrategy}

And this historical price data:
${JSON.stringify(historicalData, null, 2)}

Simulate how many trades would have been executed and what the P&L would be.
Provide entry points, exit points, and reasoning for each trade.
`

      const response = await client.chat.completions.create({
        model: 'deepseek-v3.2',
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content:
              'You are a trading analysis expert. Perform detailed backtest analysis and provide statistics.',
          },
          { role: 'user', content: backtestPrompt },
        ],
      })

      return Response.json({
        backtestResults: response.choices[0].message.content,
        timestamp: new Date().toISOString(),
      })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[Agent API Error]:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function parseTradingAction(content) {
  const actionMatch = content.match(/ACTION:\s*([A-Z_]+)/i)
  const symbolMatch = content.match(/SYMBOL:\s*(\w+)/i)
  const typeMatch = content.match(/TYPE:\s*(PERP|SPOT)/i)
  const sizeMatch = content.match(/SIZE:\s*([\d.]+)/i)
  const entryMatch = content.match(/ENTRY:\s*([\d.]+)/i)
  const slMatch = content.match(/STOP_LOSS:\s*([\d.]+)/i)
  const tpMatch = content.match(/TAKE_PROFIT:\s*([\d.]+)/i)

  if (!actionMatch || actionMatch[1] === 'WAIT') {
    return { action: 'WAIT', reason: 'Conditions not met' }
  }

  return {
    action: actionMatch ? actionMatch[1] : null,
    symbol: symbolMatch ? symbolMatch[1] : null,
    type: typeMatch ? typeMatch[1] : null,
    size: sizeMatch ? parseFloat(sizeMatch[1]) : null,
    entry: entryMatch ? parseFloat(entryMatch[1]) : null,
    stopLoss: slMatch ? parseFloat(slMatch[1]) : null,
    takeProfit: tpMatch ? parseFloat(tpMatch[1]) : null,
  }
}

async function executePerpTrade(tradeAction, userAddress) {
  try {
    // Call Hyperliquid API
    const res = await fetch('/api/hyperliquid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'placeTrade',
        payload: {
          address: userAddress,
          symbol: tradeAction.symbol,
          side: tradeAction.action.includes('LONG') ? 'long' : 'short',
          size: tradeAction.size,
          leverage: tradeAction.leverage || 1,
          stopLoss: tradeAction.stopLoss,
          takeProfit: tradeAction.takeProfit,
        },
      }),
    })

    const data = await res.json()

    return {
      success: data.success,
      txHash: data.txHash || data.orderId,
      details: data,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: null,
    }
  }
}

async function executeSpotTrade(tradeAction, userAddress) {
  try {
    // Call Aster DEX API
    const res = await fetch('/api/aster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'executeSwap',
        payload: {
          address: userAddress,
          tokenIn: tradeAction.tokenIn,
          tokenOut: tradeAction.tokenOut,
          amount: tradeAction.size,
          minOutputAmount: tradeAction.minOutput || 0,
        },
      }),
    })

    const data = await res.json()

    return {
      success: data.success,
      txHash: data.txHash,
      details: data,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: null,
    }
  }
}
