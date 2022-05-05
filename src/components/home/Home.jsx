import { useState, useEffect, useCallback } from 'react';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';
import { Card, Button, Spacer, Divider, Text, Note } from '@geist-ui/core';

const web3Modal = new Web3Modal({
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

const switchAccount = async () => {
  await window.ethereum.request({
    method: 'wallet_requestPermissions',
    params: [
      {
        eth_accounts: {},
      },
    ],
  });
};

export const Home = ({ handleConnected }) => {
  const [injectedProvider, setInjectedProvider] = useState();
  const [signer, setSigner] = useState();
  const [account, setAccount] = useState({ address: '', balance: '', chainId: '' });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function init() {
      if (web3Modal.cachedProvider) {
        connectWallet();
      }
    }
    init();
  }, []);

  const connectWallet = useCallback(async () => {
    const instance = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(instance);
    setInjectedProvider(provider);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const balance = ethers.utils.formatEther(await signer.getBalance()) + ' ETH';
    const chainId = await signer.getChainId();
    const account = {
      address,
      balance,
      chainId,
    };
    setAccount(account);
    setConnected(true);
    handleConnected(true);
  }, [signer]);

  const disconectWallet = async () => {
    await web3Modal.clearCachedProvider();
    setTimeout(() => {
      setConnected(false);
      handleConnected(false);
      window.location.reload();
    }, 1);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', gap: '1rem', marginTop: '1rem' }}>
      <div>
        {!connected ? (
          <Note label={false}>
            <Text b>Welcome to Posts 👋</Text>
            <Text>Connect your wallet to get started!</Text>
          </Note>
        ) : (
          <Card>
            <Card.Content>
              <Text b>Account</Text>
            </Card.Content>
            <Divider />
            <Card.Content>
              <div>
                <Text>{account.address}</Text>
                <Text>{account.balance}</Text>
                <Text>{account.chainId}</Text>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!connected ? (
          <Button type='secondary' onClick={connectWallet}>
            Connect Wallet
          </Button>
        ) : (
          <>
            <Button type='secondary' onClick={disconectWallet}>
              Disconnect Wallet
            </Button>
            <Spacer />
            <Button type='secondary' ghost onClick={switchAccount}>
              Switch Account
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

window.ethereum &&
  window.ethereum.on('chainChanged', (chainId) => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1);
  });

window.ethereum &&
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0) {
      await web3Modal.clearCachedProvider();
      setTimeout(() => {
        window.location.reload();
      }, 1);
    }
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1);
  });
