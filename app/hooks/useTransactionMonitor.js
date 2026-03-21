// useTransactionMonitor.js

import { useEffect, useState } from 'react';

const useTransactionMonitor = (transactionHash) => {
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const interval = setInterval(async () => {
      // Replace with actual API call to check transaction status
      const response = await fetch(`https://api.basechain.com/tx/${transactionHash}`);
      const data = await response.json();

      if (data.status === 'confirmed') {
        setStatus('confirmed');
        clearInterval(interval);
      } else if (data.status === 'reverted') {
        setStatus('reverted');
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [transactionHash]);

  return status;
};

export default useTransactionMonitor;
