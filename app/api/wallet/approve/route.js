export const dynamic = 'force-dynamic'

const USDC_ADDRESS = process.env.USDC_BASE_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const BANKR_WALLET = process.env.BANKR_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000'

export async function POST(req) {
  try {
    const { action, pair, amount, userAddress } = await req.json()

    if (!action || !pair || !amount || !userAddress) {
      return Response.json({ error: 'Missing: action, pair, amount, userAddress' }, { status: 400 })
    }

    const amountWei = (parseFloat(amount) * 1e6).toFixed(0)
    const deadline  = Math.floor(Date.now() / 1000) + 3600

    const permitData = {
      types: {
        EIP712Domain: [
          { name: 'name',              type: 'string'  },
          { name: 'version',           type: 'string'  },
          { name: 'chainId',           type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Permit: [
          { name: 'owner',    type: 'address' },
          { name: 'spender',  type: 'address' },
          { name: 'value',    type: 'uint256' },
          { name: 'nonce',    type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      domain: {
        name:              'USD Coin',
        version:           '2',
        chainId:           8453,
        verifyingContract: USDC_ADDRESS,
      },
      primaryType: 'Permit',
      message: {
        owner:    userAddress,
        spender:  BANKR_WALLET,
        value:    amountWei,
        nonce:    0,
        deadline,
      },
    }

    return Response.json({
      success:     true,
      action,
      pair,
      amount,
      amountWei,
      permitData,
      chainId:     8453,
      usdcAddress: USDC_ADDRESS,
      spender:     BANKR_WALLET,
      deadline,
    })
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
