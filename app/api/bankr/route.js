export async function POST(req) {
  try {
    const { prompt, readOnly = false } = await req.json()
    if (!prompt) return Response.json({ error: 'Prompt required' }, { status: 400 })

    const res = await fetch('https://api.bankr.bot/agent/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BANKR_API_KEY}`,
      },
      body: JSON.stringify({ prompt, readOnly }),
    })

    if (!res.ok) {
      const err = await res.text()
      return Response.json({ error: 'Bankr API error' }, { status: res.status })
    }

    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
