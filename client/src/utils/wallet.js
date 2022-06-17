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
    const balance = Number(ethers.utils.formatEther(await signer.getBalance()));
    const chainID = await signer.getChainId();

    return { provider, injectedProvider, signer, address, balance, chainID };
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};

export const disconectWallet = async () => {
  let walletDisconnected = false,
    threadDBDisconnected = false,
    litDisconnected = false;

  const credentials = JSON.parse(localStorage.getItem('payload'));

  if (credentials !== null) {
    localStorage.removeItem('payload');

    threadDBDisconnected = true;
  }

  const litAuthSignature = JSON.parse(localStorage.getItem('lit-auth-signature'));

  if (litAuthSignature !== null) {
    localStorage.removeItem('lit-auth-signature');

    litDisconnected = true;
  }

  await web3Modal.clearCachedProvider();

  walletDisconnected = true;

  return { threadDBDisconnected, litDisconnected, walletDisconnected };
};
