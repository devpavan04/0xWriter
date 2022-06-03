import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';

export const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: process.env.REACT_APP_INFURA_API_KEY,
      },
    },
  },
  theme: 'dark',
});

export const connectWallet = async () => {
  try {
    const provider = await web3Modal.connect();
    const injectedProvider = new ethers.providers.Web3Provider(provider);
    const signer = injectedProvider.getSigner();
    const address = await signer.getAddress();
    const balance = Number(ethers.utils.formatEther(await signer.getBalance())).toFixed(2);
    const chainId = await signer.getChainId();

    return { provider, injectedProvider, signer, address, balance, chainId };
  } catch (e) {
    console.log(e);

    throw new Error('Wallet connection failed!');
  }
};
