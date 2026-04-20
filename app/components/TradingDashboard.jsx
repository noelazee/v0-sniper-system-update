'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

export default function TradingDashboard() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('perp') // perp or spot
  const [orderType, setOrderType] = useState('market') // market or limit
  const [side, setSide] = useState('long') // long or short (perp only)
  const [orderMode, setOrderMode] = useState('buy') // buy or sell (spot only)
  
  // Form inputs
  const [symbol, setSymbol] = useState('BTC')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [leverage, setLeverage] = useState('1')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  
  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [positions, setPositions] = useState([])
  const [orders, setOrders] = useState([])
  const [balance, setBalance] = useState(0)
  const [marketData, setMarketData] = useState({})

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-data')
        const data = await response.json()
        setMarketData(data)
      } catch (err) {
        console.error('Error fetching market data:', err)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch user positions and orders
  useEffect(() => {
    if (!isConnected || !address) return

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user-data?address=${address}`)
        const data = await response.json()
        setPositions(data.positions || [])
        setOrders(data.orders || [])
        setBalance(data.balance || 0)
      } catch (err) {
        console.error('Error fetching user data:', err)
      }
    }

    fetchUserData()
    const interval = setInterval(fetchUserData, 3000)
    return () => clearInterval(interval)
  }, [isConnected, address])

  const handleExecutePerp = async () => {
    if (!isConnected) {
      setError('Please connect wallet first')
      return
    }

    if (!size || !symbol) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/hyperliquid/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          symbol: `${symbol}USDT`,
          side, // 'long' or 'short'
          size: parseFloat(size),
          leverage: parseFloat(leverage),
          orderType,
          price: orderType === 'limit' ? parseFloat(price) : undefined,
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Trade execution failed')
      }

      setSuccess(`Order placed: ${side.toUpperCase()} ${size} ${symbol}USDT`)
      setSize('')
      setPrice('')
      setStopLoss('')
      setTakeProfit('')
      
      // Refresh user data
      const dataResponse = await fetch(`/api/user-data?address=${address}`)
      const userData = await dataResponse.json()
      setPositions(userData.positions || [])
      setOrders(userData.orders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteSpot = async () => {
    if (!isConnected) {
      setError('Please connect wallet first')
      return
    }

    if (!size || !symbol) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const tokenOut = orderMode === 'buy' ? symbol : 'USDT'
      const tokenIn = orderMode === 'buy' ? 'USDT' : symbol

      const response = await fetch('/api/aster/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          tokenIn,
          tokenOut,
          amount: parseFloat(size),
          slippage: 0.5,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Swap execution failed')
      }

      setSuccess(`Swap executed: ${size} ${tokenIn} → ${tokenOut}`)
      setSize('')
      
      // Refresh user data
      const dataResponse = await fetch(`/api/user-data?address=${address}`)
      const userData = await dataResponse.json()
      setPositions(userData.positions || [])
      setOrders(userData.orders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!isConnected) return

    try {
      const response = await fetch('/api/hyperliquid/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, orderId }),
      })

      if (!response.ok) throw new Error('Cancel failed')

      // Refresh
      const dataResponse = await fetch(`/api/user-data?address=${address}`)
      const userData = await dataResponse.json()
      setOrders(userData.orders || [])
      setSuccess('Order cancelled')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleClosePosition = async (positionId) => {
    if (!isConnected) return

    try {
      const response = await fetch('/api/hyperliquid/close-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, positionId }),
      })

      if (!response.ok) throw new Error('Close failed')

      // Refresh
      const dataResponse = await fetch(`/api/user-data?address=${address}`)
      const userData = await dataResponse.json()
      setPositions(userData.positions || [])
      setSuccess('Position closed')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', background: '#050508', minHeight: '100vh' }}>
      {/* Left Panel - Order Form */}
      <div style={{ flex: '0 0 350px', background: '#1a1a2e', borderRadius: '12px', padding: '20px', border: '1px solid #2d2d45' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => setActiveTab('perp')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'perp' ? '#7c3aed' : 'transparent',
                border: '1px solid #2d2d45',
                borderRadius: '6px',
                color: activeTab === 'perp' ? '#fff' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              PERP
            </button>
            <button
              onClick={() => setActiveTab('spot')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'spot' ? '#7c3aed' : 'transparent',
                border: '1px solid #2d2d45',
                borderRadius: '6px',
                color: activeTab === 'spot' ? '#fff' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              SPOT
            </button>
          </div>
        </div>

        {/* Symbol */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BTC, ETH, SOL..."
            style={{
              width: '100%',
              padding: '10px',
              background: '#0f0f1e',
              border: '1px solid #2d2d45',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Size */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Size</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.0"
            style={{
              width: '100%',
              padding: '10px',
              background: '#0f0f1e',
              border: '1px solid #2d2d45',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {activeTab === 'perp' ? (
          <>
            {/* Side */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Side</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setSide('long')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: side === 'long' ? '#10b981' : '#0f0f1e',
                    border: `1px solid ${side === 'long' ? '#10b981' : '#2d2d45'}`,
                    borderRadius: '6px',
                    color: side === 'long' ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  LONG
                </button>
                <button
                  onClick={() => setSide('short')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: side === 'short' ? '#ef4444' : '#0f0f1e',
                    border: `1px solid ${side === 'short' ? '#ef4444' : '#2d2d45'}`,
                    borderRadius: '6px',
                    color: side === 'short' ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  SHORT
                </button>
              </div>
            </div>

            {/* Leverage */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Leverage ({leverage}x)</label>
              <input
                type="range"
                min="1"
                max="50"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Order Type */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Order Type</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setOrderType('market')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: orderType === 'market' ? '#7c3aed' : '#0f0f1e',
                    border: `1px solid ${orderType === 'market' ? '#7c3aed' : '#2d2d45'}`,
                    borderRadius: '6px',
                    color: orderType === 'market' ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Market
                </button>
                <button
                  onClick={() => setOrderType('limit')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: orderType === 'limit' ? '#7c3aed' : '#0f0f1e',
                    border: `1px solid ${orderType === 'limit' ? '#7c3aed' : '#2d2d45'}`,
                    borderRadius: '6px',
                    color: orderType === 'limit' ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Limit
                </button>
              </div>
            </div>

            {orderType === 'limit' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Price</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f0f1e',
                    border: '1px solid #2d2d45',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* SL/TP */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.0 (optional)"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#0f0f1e',
                  border: '1px solid #2d2d45',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  marginBottom: '10px',
                }}
              />
              <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Take Profit</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="0.0 (optional)"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#0f0f1e',
                  border: '1px solid #2d2d45',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleExecutePerp}
              disabled={loading || !isConnected}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#4a5568' : side === 'long' ? '#10b981' : '#ef4444',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Executing...' : `${side.toUpperCase()} ${size || '0'} ${symbol}`}
            </button>
          </>
        ) : (
          <>
            {/* Mode */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '5px' }}>Mode</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setOrderMode('buy')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: orderMode === 'buy' ? '#10b981' : '#0f0f1e',
                    border: `1px solid ${orderMode === 'buy' ? '#10b981' : '#2d2d45'}`,
                    borderRadius: '6px',
                    color: orderMode === 'buy' ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  BUY
                </button>
                <button
                  onClick={() => setOrderMode('sell')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: orderMode === 'sell' ? '#ef4444' : '#0f0f1e',
                    border: `1px solid ${orderMode === 'sell' ? '#ef4444' : '#2d2d45'}`,
                    borderRadius: '6px',
                    color: orderMode === 'sell' ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  SELL
                </button>
              </div>
            </div>

            <button
              onClick={handleExecuteSpot}
              disabled={loading || !isConnected}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#4a5568' : orderMode === 'buy' ? '#10b981' : '#ef4444',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginTop: '20px',
              }}
            >
              {loading ? 'Swapping...' : `${orderMode.toUpperCase()} ${size || '0'} ${symbol}`}
            </button>
          </>
        )}

        {/* Messages */}
        {error && (
          <div style={{ marginTop: '15px', padding: '12px', background: '#7f1d1d', borderRadius: '6px', color: '#fca5a5', fontSize: '12px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: '15px', padding: '12px', background: '#064e3b', borderRadius: '6px', color: '#6ee7b7', fontSize: '12px' }}>
            {success}
          </div>
        )}
      </div>

      {/* Right Panel - Positions & Orders */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Positions */}
        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px', border: '1px solid #2d2d45' }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Positions</h3>
          {positions.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No open positions</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', color: '#e2e8f0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2d2d45' }}>
                    <th style={{ textAlign: 'left', padding: '10px', color: '#a0aec0' }}>Symbol</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>Side</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>Size</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>Entry</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>Mark</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>P&L</th>
                    <th style={{ textAlign: 'center', padding: '10px', color: '#a0aec0' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.id} style={{ borderBottom: '1px solid #2d2d45' }}>
                      <td style={{ padding: '10px' }}>{pos.symbol}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: pos.side === 'long' ? '#10b981' : '#ef4444' }}>
                        {pos.side.toUpperCase()}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>{pos.size}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>${pos.entryPrice?.toFixed(2) || 'N/A'}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>${pos.markPrice?.toFixed(2) || 'N/A'}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: (pos.pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        ${(pos.pnl || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px' }}>
                        <button
                          onClick={() => handleClosePosition(pos.id)}
                          style={{
                            padding: '5px 10px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Orders */}
        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px', border: '1px solid #2d2d45' }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Open Orders</h3>
          {orders.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No open orders</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', color: '#e2e8f0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2d2d45' }}>
                    <th style={{ textAlign: 'left', padding: '10px', color: '#a0aec0' }}>Symbol</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>Side</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>Size</th>
                    <th style={{ textAlign: 'right', padding: '10px', color: '#a0aec0' }}>Price</th>
                    <th style={{ textAlign: 'center', padding: '10px', color: '#a0aec0' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #2d2d45' }}>
                      <td style={{ padding: '10px' }}>{order.symbol}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: order.side === 'buy' ? '#10b981' : '#ef4444' }}>
                        {order.side.toUpperCase()}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>{order.size}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>${order.price?.toFixed(2) || 'Market'}</td>
                      <td style={{ textAlign: 'center', padding: '10px' }}>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          style={{
                            padding: '5px 10px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
