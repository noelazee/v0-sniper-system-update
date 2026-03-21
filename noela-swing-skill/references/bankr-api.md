```
███╗   ██╗ ██████╗ ███████╗
████╗  ██║██╔═══██╗██╔════╝
██╔██╗ ██║██║   ██║█████╗  
██║╚██╗██║██║   ██║██╔══╝  
██║ ╚████║╚██████╔╝███████╗
╚═╝  ╚═══╝ ╚═════╝ ╚══════╝

███████╗██╗    ██╗██╗███╗   ██╗ ██████╗ 
██╔════╝██║    ██║██║████╗  ██║██╔════╝ 
███████╗██║ █╗ ██║██║██╔██╗ ██║██║  ███╗
╚════██║██║███╗██║██║██║╚██╗██║██║   ██║
███████║╚███╔███╔╝██║██║ ╚████║╚██████╔╝
╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 

  Liquidity Hunter & DEX Swing Trader
  Powered by Bankr Agent API
  Built by @noelazee — v0-gbot.vercel.app
```

---

```
██████╗  █████╗ ███╗   ██╗██╗  ██╗██████╗ 
██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝██╔══██╗
██████╔╝███████║██╔██╗ ██║█████╔╝ ██████╔╝
██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ ██╔══██╗
██████╔╝██║  ██║██║ ╚████║██║  ██╗██║  ██║
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝
```

```
POST https://api.bankr.bot/agent/prompt
Content-Type: application/json
X-API-Key: {your Bankr API key}
```

---

```
███████╗██╗    ██╗██╗███╗   ██╗ ██████╗     
██╔════╝██║    ██║██║████╗  ██║██╔════╝     
███████╗██║ █╗ ██║██║██╔██╗ ██║██║  ███╗    
╚════██║██║███╗██║██║██║╚██╗██║██║   ██║    
███████║╚███╔███╔╝██║██║ ╚████║╚██████╔╝    
╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝     
  FUTURES
```

### Long Entry
```json
{ "prompt": "buy $100 of ETH at market. SL: 3200. TP1: 3500. TP2: 3800. This is a swing position.", "readOnly": false }
```

### Short Entry
```json
{ "prompt": "sell $100 of BTC at market. SL: 72000. TP1: 69000. TP2: 67000. This is a swing position.", "readOnly": false }
```

### Partial Close at TP1
```json
{ "prompt": "close 50% of my ETH swing position at market. Keep runner for TP2 at 3800.", "readOnly": false }
```

### Move SL to Breakeven
```json
{ "prompt": "move stop loss for ETH position to breakeven at 3350.", "readOnly": false }
```

---

```
██████╗ ███████╗██╗  ██╗    
██╔══██╗██╔════╝╚██╗██╔╝    
██║  ██║█████╗   ╚███╔╝     
██║  ██║██╔══╝   ██╔██╗     
██████╔╝███████╗██╔╝ ██╗    
╚═════╝ ╚══════╝╚═╝  ╚═╝    
  TOKEN HUNTER
```

### Buy Token Swing
```json
{ "prompt": "buy $100 of PEPE on Uniswap on Base. SL: 0.000008. TP1: 0.000015. TP2: 0.000022. This is a swing position.", "readOnly": false }
```

### Partial Close DEX Token
```json
{ "prompt": "sell 50% of my PEPE on Base at market. Keep runner for TP2.", "readOnly": false }
```

### Screen a Token
```json
{ "prompt": "check token 0xABC... on Base. Is liquidity locked? Volume trend over the last 7 days? Dev wallet activity? Any rug signals?", "readOnly": true }
```

### Check Dev Wallet
```json
{ "prompt": "analyze dev wallet activity for 0xABC... on Base. Has the dev been dumping? What is the wallet distribution?", "readOnly": true }
```

### Check Unlock Schedule
```json
{ "prompt": "are there any token unlock events for 0xABC... in the next 30 days?", "readOnly": true }
```

---

```
███████╗███╗   ██╗██╗██████╗ ███████╗██████╗      
██╔════╝████╗  ██║██║██╔══██╗██╔════╝██╔══██╗     
███████╗██╔██╗ ██║██║██████╔╝█████╗  ██████╔╝     
╚════██║██║╚██╗██║██║██╔═══╝ ██╔══╝  ██╔══██╗     
███████║██║ ╚████║██║██║     ███████╗██║  ██║     
╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝     
vs
███████╗██╗    ██╗██╗███╗   ██╗ ██████╗ 
██╔════╝██║    ██║██║████╗  ██║██╔════╝ 
███████╗██║ █╗ ██║██║██╔██╗ ██║██║  ███╗
╚════██║██║███╗██║██║██║╚██╗██║██║   ██║
███████║╚███╔███╔╝██║██║ ╚████║╚██████╔╝
╚══════╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
```

| | NoE Sniper | NoE Swing |
|---|---|---|
| Default size | $50 | $100+ |
| Partial close | Optional | **Required at TP1** |
| Breakeven move | Optional | **Required after TP1** |
| Unlock check | 14 days | **30 days** |
| Prompt tag | — | **"This is a swing position"** |

---

```
██████╗  █████╗ ████████╗███████╗    ██╗     ██╗███╗   ███╗██╗████████╗███████╗
██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ██║     ██║████╗ ████║██║╚══██╔══╝██╔════╝
██████╔╝███████║   ██║   █████╗      ██║     ██║██╔████╔██║██║   ██║   ███████╗ 
██╔══██╗██╔══██║   ██║   ██╔══╝      ██║     ██║██║╚██╔╝██║██║   ██║   ╚════██║ 
██║  ██║██║  ██║   ██║   ███████╗    ███████╗██║██║ ╚═╝ ██║██║   ██║   ███████║ 
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚══════╝╚═╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚══════╝
```

- Standard account → **100 messages / day** (rolling 24h)
- Bankr Club → **1,000 messages / day**
- Swing uses fewer calls per trade — stays well within limits

---

```
 ██████╗ ██╗████████╗██╗  ██╗██╗   ██╗██████╗ 
██╔════╝ ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗
██║  ███╗██║   ██║   ███████║██║   ██║██████╔╝
██║   ██║██║   ██║   ██╔══██║██║   ██║██╔══██╗
╚██████╔╝██║   ██║   ██║  ██║╚██████╔╝██████╔╝
 ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
  github.com/noelazee — v0-gbot.vercel.app
```
