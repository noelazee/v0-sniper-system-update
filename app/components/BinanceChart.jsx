'use client';

import { useEffect, useRef, useState } from 'react';

export default function BinanceChart({ symbol = 'BTCUSDT', interval = '15m', height = 400 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastPrice, setLastPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);

  useEffect(() => {
    const initChart = async () => {
      try {
        // Dynamically import lightweight-charts (browser-only)
        const { createChart } = await import('lightweight-charts');

        if (!containerRef.current) return;

        // Create chart
        const chart = createChart(containerRef.current, {
          layout: {
            textColor: '#d1d5db',
            background: { color: '#0f172a' },
          },
          width: containerRef.current.clientWidth,
          height: height,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            barSpacing: 12,
          },
          watermark: {
            color: 'rgba(11, 94, 215, 0.4)',
            visible: true,
            text: 'NOELA SNIPER',
            fontSize: 20,
            horzAlign: 'right',
            vertAlign: 'bottom',
          },
        });

        chartRef.current = chart;

        // Fetch historical klines from Binance
        const fetchKlines = async () => {
          try {
            const response = await fetch(
              `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
            );
            const data = await response.json();

            if (!Array.isArray(data)) throw new Error('Invalid data format');

            // Transform Binance klines to TradingView format
            const candlesticks = data.map((kline) => ({
              time: Math.floor(kline[0] / 1000),
              open: parseFloat(kline[1]),
              high: parseFloat(kline[2]),
              low: parseFloat(kline[3]),
              close: parseFloat(kline[4]),
            }));

            // Create candlestick series
            const series = chart.addCandlestickSeries({
              upColor: '#00f5a0',
              downColor: '#ff4757',
              borderUpColor: '#00f5a0',
              borderDownColor: '#ff4757',
              wickUpColor: '#00f5a0',
              wickDownColor: '#ff4757',
            });

            series.setData(candlesticks);
            seriesRef.current = series;

            // Set last price
            const lastCandle = candlesticks[candlesticks.length - 1];
            setLastPrice(lastCandle.close);
            setPriceChange(
              ((lastCandle.close - candlesticks[0].open) / candlesticks[0].open) * 100
            );

            // Fit content
            chart.timeScale().fitContent();

            setLoading(false);
          } catch (err) {
            console.error('[v0] Klines fetch error:', err);
            setError('Failed to load chart data');
            setLoading(false);
          }
        };

        await fetchKlines();

        // Setup WebSocket for real-time updates
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          const kline = message.k;

          if (seriesRef.current) {
            seriesRef.current.update({
              time: Math.floor(kline.t / 1000),
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
            });

            setLastPrice(parseFloat(kline.c));
          }
        };

        ws.onerror = (err) => {
          console.error('[v0] WebSocket error:', err);
        };

        // Handle window resize
        const handleResize = () => {
          if (containerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: containerRef.current.clientWidth,
            });
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (ws.readyState === WebSocket.OPEN) ws.close();
          if (chartRef.current) chartRef.current.remove();
        };
      } catch (err) {
        console.error('[v0] Chart init error:', err);
        setError('Failed to initialize chart');
        setLoading(false);
      }
    };

    initChart();
  }, [symbol, interval, height]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            zIndex: 10,
            borderRadius: '8px',
          }}
        >
          <div style={{ color: '#00f5a0', fontSize: '14px' }}>Loading chart...</div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px',
            background: '#ff4757',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: '8px',
          background: '#0f172a',
          border: '1px solid #1e293b',
          overflow: 'hidden',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          padding: '8px 12px',
          background: '#1e293b',
          borderRadius: '6px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            {symbol}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00f5a0' }}>
            ${lastPrice.toFixed(2)}
          </div>
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: priceChange >= 0 ? '#00f5a0' : '#ff4757',
          }}
        >
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
