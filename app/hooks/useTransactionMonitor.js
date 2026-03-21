import { useEffect, useState } from 'react'

const useTransactionMonitor = (transactionHash) => {
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    if (!transactionHash) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `https://api.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash=${transactionHash}&apikey=${process.env.NEXT_PUBLIC_BASESCAN_API_KEY}`
        )
        const data = await res.json()

        if (data.result?.status === '1') {
          setStatus('confirmed')
          clearInterval(interval)
        } else if (data.result?.status === '0') {
          setStatus('reverted')
          clearInterval(interval)
        }
      } catch {
        setStatus('error')
        clearInterval(interval)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [transactionHash])

  return status
}

export default useTransactionMonitor