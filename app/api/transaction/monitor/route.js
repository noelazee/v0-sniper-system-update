export const dynamic = 'force-dynamic'

const BASE_RPC     = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const USDC_ADDRESS = process.env.USDC_BASE_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

async function rpcCall(method, params) {
  const res = await fetch(BASE_RPC, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal:  AbortSignal.timeout(8000),
  })
  const data = await res.json()
  return data.result
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const txHash  = searchParams.get('tx')
    const address = searchParams.get('address')

    if (txHash) {
      const receipt = await rpcCall('eth_getTransactionReceipt', [txHash])
      if (!receipt) return Response.json({ status: 'pending', txHash })
      return Response.json({
        status:      receipt.status === '0x1' ? 'success' : 'failed',
        txHash,
        blockNumber: parseInt(receipt.blockNumber, 16),
        gasUsed:     parseInt(receipt.gasUsed, 16),
        explorerUrl: `https://basescan.org/tx/${txHash}`,
      })
    }

    if (address) {
      const callData = '0x70a08231' + address.replace('0x', '').padStart(64, '0')
      const result   = await rpcCall('eth_call', [{ to: USDC_ADDRESS, data: callData }, 'latest'])
      const balance  = parseInt(result, 16) / 1e6
      return Response.json({
        address,
        usdcBalance: balance.toFixed(2),
        chain:       'Base',
        chainId:     8453,
      })
    }

    return Response.json({ error: 'Provide ?tx= or ?address= param' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
