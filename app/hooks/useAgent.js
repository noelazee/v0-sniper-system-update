'use client'

import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'

export function useAgent() {
  const { address } = useAccount()
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentStrategy, setAgentStrategy] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Analyze market with agent
  const analyzeMarket = useCallback(
    async (marketData, currentPositions) => {
      if (!agentStrategy.trim()) {
        setError('Agent strategy not configured')
        return null
      }

      try {
        setLoading(true)
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze',
            agentStrategy,
            marketData,
            currentPositions,
            userAddress: address,
          }),
        })

        const data = await res.json()
        setAnalysis(data)
        setError(null)
        return data
      } catch (err) {
        setError(err.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [agentStrategy, address]
  )

  // Execute trade recommended by agent
  const executeTrade = useCallback(
    async (tradeAction, tradeType) => {
      if (!address) {
        setError('Wallet not connected')
        return null
      }

      try {
        setLoading(true)
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute',
            tradeAction,
            type: tradeType,
            userAddress: address,
          }),
        })

        const data = await res.json()

        if (data.success) {
          setTrades((prev) => [
            ...prev,
            {
              ...tradeAction,
              type: tradeType,
              txHash: data.txHash,
              timestamp: new Date().toISOString(),
              status: 'executed',
            },
          ])
          setError(null)
        } else {
          setError(data.error || 'Trade execution failed')
        }

        return data
      } catch (err) {
        setError(err.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [address]
  )

  // Run continuous agent loop (manual trigger)
  const runAgentOnce = useCallback(async (marketData, positions) => {
    const analysisResult = await analyzeMarket(marketData, positions)

    if (analysisResult?.action?.action && analysisResult.action.action !== 'WAIT') {
      // Auto-execute if trading action found
      await executeTrade(analysisResult.action, analysisResult.action.type)
    }

    return analysisResult
  }, [analyzeMarket, executeTrade])

  // Start/stop automated agent (simulated - real implementation would use job queue)
  const toggleAgent = useCallback((enabled) => {
    setAgentRunning(enabled)
  }, [])

  // Backtest strategy
  const backtestStrategy = useCallback(async (historicalData) => {
    if (!agentStrategy.trim()) {
      setError('Agent strategy not configured')
      return null
    }

    try {
      setLoading(true)
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'backtest',
          agentStrategy,
          historicalData,
        }),
      })

      const data = await res.json()
      setError(null)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [agentStrategy])

  return {
    // State
    agentRunning,
    agentStrategy,
    analysis,
    trades,
    loading,
    error,

    // Methods
    setAgentStrategy,
    analyzeMarket,
    executeTrade,
    runAgentOnce,
    toggleAgent,
    backtestStrategy,
  }
}
