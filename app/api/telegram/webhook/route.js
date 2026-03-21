export const dynamic = 'force-dynamic'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const BANKR_KEY      = process.env.BANKR_API_KEY
const CHAT_ID        = process.env.TELEGRAM_CHAT_ID

async function sendMsg(chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' }
  if (replyMarkup) body.reply_markup = replyMarkup
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

async function answerCb(id, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ callback_query_id: id, text }),
  })
}

export async function POST(req) {
  try {
    const body = await req.json()

    if (body.callback_query) {
      const cb     = body.callback_query
      const chatId = cb.message.chat.id
      await answerCb(cb.id, 'Processing...')

      const [action, dir, amount, pair] = (cb.data || '').split(':')

      if (action === 'approve') {
        const res  = await fetch('https://api.bankr.bot/agent/prompt', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BANKR_KEY}` },
          body:    JSON.stringify({ prompt: `${dir} $${amount} of ${pair}/USDT at market`, readOnly: false }),
        })
        const data = await res.json()
        await sendMsg(chatId, `✅ *Order Executed*\n\n${data.response || 'Done.'}`)
      }

      if (action === 'reject') {
        await sendMsg(chatId, `❌ *Trade Rejected*\n\nWaiting for next signal.`)
      }

      return Response.json({ ok: true })
    }

    if (body.message) {
      const chatId = body.message.chat.id
      const text   = body.message.text || ''

      if (text === '/start') {
        await sendMsg(chatId,
          `🎯 *NOELA Sniper Bot*\n\nSinyal trading otomatis.\n\n/status - Status bot\n/pairs - Harga live`
        )
      }

      if (text === '/status') {
        await sendMsg(chatId, `✅ Bot aktif\n📡 Binance: connected\n⚡ Bankr: ready`)
      }

      if (text === '/pairs') {
        const res  = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"]')
        const data = await res.json()
        const lines = data.map(t => {
          const ch = parseFloat(t.priceChangePercent)
          return `${t.symbol.replace('USDT','')}: $${parseFloat(t.lastPrice).toFixed(2)} (${ch>=0?'+':''}${ch.toFixed(2)}%)`
        })
        await sendMsg(chatId, `📊 *Live Prices*\n\n${lines.join('\n')}`)
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[Telegram]', err)
    return Response.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ status: 'Telegram webhook active', chatId: CHAT_ID })
}
