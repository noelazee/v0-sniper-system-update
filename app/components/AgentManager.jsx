'use client'

import { useState } from 'react'
import { useAgent } from '../hooks/useAgent'
import { useAccount } from 'wagmi'

export default function AgentManager() {
  const { address, isConnected } = useAccount()
  const {
    agentRunning,
    agentStrategy,
    analysis,
    trades,
    loading,
    error,
    setAgentStrategy,
    analyzeMarket,
    executeTrade,
    runAgentOnce,
    toggleAgent,
    backtestStrategy,
  } = useAgent()

  const [selectedTab, setSelectedTab] = useState('configure') // configure, analyze, trades, backtest
  const [mockMarketData, setMockMarketData] = useState({
    BTC: 67000,
    ETH: 3500,
    SOL: 145,
  })
  const [mockPositions, setMockPositions] = useState([])

  const handleRunAgent = async () => {
    await runAgentOnce(mockMarketData, mockPositions)
  }

  const handleExecuteTrade = async (trade) => {
    if (!trade) return

    const tradeType = trade.type || (trade.action?.includes('PERP') ? 'PERP' : 'SPOT')
    await executeTrade(trade, tradeType)
  }

  const handleBacktest = async () => {
    const historicalData = [
      { timestamp: Date.now() - 3600000, BTC: 66800, ETH: 3480 },
      { timestamp: Date.now() - 1800000, BTC: 66900, ETH: 3490 },
      { timestamp: Date.now(), BTC: 67000, ETH: 3500 },
    ]
    await backtestStrategy(historicalData)
  }

  if (!isConnected) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid #0f4c75',
          borderRadius: '12px',
          padding: '24px',
          color: '#e2e8f0',
          textAlign: 'center',
        }}
      >
        <p>Connect wallet to use Agent trading</p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        border: '1px solid #0f4c75',
        borderRadius: '12px',
        padding: '20px',
        color: '#e2e8f0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #0f4c75',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '600' }}>Trading Agent</h2>
          <p style={{ margin: '0', fontSize: '12px', color: '#94a3b8' }}>
            {agentRunning ? '🟢 Running' : '⚪ Idle'} • Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        <button
          onClick={() => toggleAgent(!agentRunning)}
          style={{
            background: agentRunning ? '#ef4444' : '#10b981',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          {agentRunning ? 'STOP' : 'START'} AGENT
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #0f4c75' }}>
        {['configure', 'analyze', 'trades', 'backtest'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              background: selectedTab === tab ? '#0f4c75' : 'transparent',
              border: 'none',
              color: selectedTab === tab ? '#4ade80' : '#64748b',
              padding: '10px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              textTransform: 'uppercase',
              borderBottom: selectedTab === tab ? '2px solid #4ade80' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: '#7f1d1d',
            border: '1px solid #dc2626',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '15px',
            fontSize: '12px',
            color: '#fca5a5',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Tab Content */}
      {selectedTab === 'configure' && (
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            Agent Strategy Prompt
          </label>
          <textarea
            value={agentStrategy}
            onChange={(e) => setAgentStrategy(e.target.value)}
            placeholder="Describe your trading strategy, rules, and conditions...&#10;&#10;Example: Buy BTC when price breaks above 67000 with volume confirmation. Sell when price rejects 68000 twice. Risk 1% per trade."
            style={{
              width: '100%',
              height: '200px',
              padding: '12px',
              background: '#1a1a2e',
              border: '1px solid #0f4c75',
              color: '#e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'monospace',
              marginBottom: '12px',
              resize: 'vertical',
            }}
          />

          <button
            onClick={handleRunAgent}
            disabled={loading || !agentStrategy.trim()}
            style={{
              width: '100%',
              background: loading || !agentStrategy.trim() ? '#64748b' : '#4ade80',
              border: 'none',
              color: loading || !agentStrategy.trim() ? '#94a3b8' : '#000',
              padding: '10px',
              borderRadius: '6px',
              cursor: loading || !agentStrategy.trim() ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {loading ? 'ANALYZING...' : 'RUN AGENT ONCE'}
          </button>

          <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
            <p>💡 Tips:</p>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Be specific about entry/exit conditions</li>
              <li>Include risk management rules</li>
              <li>Define position sizing strategy</li>
              <li>Specify which markets (PERP/SPOT)</li>
            </ul>
          </div>
        </div>
      )}

      {selectedTab === 'analyze' && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>Market Prices</p>
            {Object.entries(mockMarketData).map(([symbol, price]) => (
              <div
                key={symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: '#1a1a2e',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
              >
                <span>{symbol}</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) =>
                    setMockMarketData({ ...mockMarketData, [symbol]: parseFloat(e.target.value) })
                  }
                  style={{
                    width: '100px',
                    background: '#0f0f1e',
                    border: '1px solid #0f4c75',
                    color: '#e2e8f0',
                    padding: '4px',
                    borderRadius: '3px',
                    fontSize: '11px',
                  }}
                />
              </div>
            ))}
          </div>

          {analysis && (
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>Analysis Result</p>
              <div
                style={{
                  background: '#1a1a2e',
                  border: '1px solid #0f4c75',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '11px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                {analysis.action?.action === 'WAIT' ? (
                  <span style={{ color: '#94a3b8' }}>⏳ Waiting for better conditions...</span>
                ) : (
                  <>
                    <div style={{ color: '#4ade80', marginBottom: '8px' }}>
                      ✓ Trade Signal: {analysis.action?.action}
                    </div>
                    <pre
                      style={{
                        margin: '0',
                        fontSize: '10px',
                        color: '#cbd5e1',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(analysis.action, null, 2)}
                    </pre>
                  </>
                )}
              </div>

              {analysis.action?.action && analysis.action.action !== 'WAIT' && (
                <button
                  onClick={() => handleExecuteTrade(analysis.action)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    background: '#ef4444',
                    border: 'none',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {loading ? 'EXECUTING...' : '🚀 EXECUTE TRADE'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'trades' && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '10px' }}>
            Executed Trades ({trades.length})
          </p>

          {trades.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
              No trades executed yet
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {trades.map((trade, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#1a1a2e',
                    border: '1px solid #0f4c75',
                    borderRadius: '6px',
                    padding: '10px',
                    marginBottom: '8px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>
                      {trade.action} {trade.symbol}
                    </span>
                    <span style={{ color: '#4ade80' }}>✓ {trade.status}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '5px' }}>
                    Size: {trade.size} | Type: {trade.type} | {new Date(trade.timestamp).toLocaleTimeString()}
                  </div>
                  {trade.txHash && (
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                      TX: {trade.txHash.slice(0, 20)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'backtest' && (
        <div>
          <p style={{ fontSize: '12px', marginBottom: '10px' }}>
            Backtest your strategy on historical data to validate before live trading.
          </p>
          <button
            onClick={handleBacktest}
            disabled={loading || !agentStrategy.trim()}
            style={{
              width: '100%',
              background: loading || !agentStrategy.trim() ? '#64748b' : '#3b82f6',
              border: 'none',
              color: 'white',
              padding: '10px',
              borderRadius: '6px',
              cursor: loading || !agentStrategy.trim() ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '10px',
            }}
          >
            {loading ? 'BACKTESTING...' : 'START BACKTEST'}
          </button>

          {analysis?.backtestResults && (
            <div
              style={{
                background: '#1a1a2e',
                border: '1px solid #0f4c75',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                maxHeight: '300px',
                overflow: 'auto',
              }}
            >
              <pre
                style={{
                  margin: '0',
                  color: '#cbd5e1',
                  whiteSpace: 'pre-wrap',
                  fontSize: '10px',
                }}
              >
                {analysis.backtestResults}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
