import { useState, useEffect, useCallback } from 'react';
import { web3Modal, connectWallet } from './lib/wallet';
import { authenticateWithCeramic } from './lib/ceramic';

import './app.css';

import { Button, Text, Note, useToasts, Tabs } from '@geist-ui/core';
import { Feather } from '@geist-ui/icons';

import { Home } from './components/home';
import { Write } from './components/write';

const App = () => {
  const { setToast } = useToasts({ placement: 'topRight', padding: '1rem' });
  const toastMessage = (type, message) => {
    setToast({ type: type, text: message, delay: 6000 });
  };

  const [provider, setProvider] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [signer, setSigner] = useState();
  const [address, setAddress] = useState();
  const [balance, setBalance] = useState();
  const [chainId, setChainId] = useState();
  const [walletConnected, setWalletConnected] = useState(false);
  const [ceramic, setCeramic] = useState();
  const [idx, setIDX] = useState();
  const [authenticated, setAuthenticated] = useState(false);
  const [basicProfile, setBasicProfile] = useState();

  useEffect(() => {
    function init() {
      if (web3Modal.cachedProvider) {
        connectWalletAndAuthenticate();
      }
    }
    init();
  }, []);

  const connectWalletAndAuthenticate = useCallback(async () => {
    try {
      const { provider, injectedProvider, signer, address, balance, chainId } = await connectWallet();
      setProvider(provider);
      setInjectedProvider(injectedProvider);
      setSigner(signer);
      setAddress(address);
      setBalance(balance);
      setChainId(chainId);

      setWalletConnected(true);

      const { ceramic, idx, basicProfile } = await authenticateWithCeramic(provider, address);
      setCeramic(ceramic);
      setIDX(idx);
      setBasicProfile(basicProfile);

      setAuthenticated(true);
    } catch (e) {
      toastMessage('error', e.message);
    }
  }, []);

  const disconectWallet = async () => {
    await web3Modal.clearCachedProvider();
    setTimeout(() => {
      setWalletConnected(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className='wrapper'>
      <div className='header'>
        <div className='heading'>
          {/* <Feather size={40} /> */}
          <Text h1>0xWriter</Text>
        </div>
        <div className='connectButtons'>
          {!walletConnected ? (
            <Button type='secondary' auto onClick={connectWallet}>
              Connect Wallet
            </Button>
          ) : (
            <>
              <Button type='secondary' auto onClick={disconectWallet}>
                Disconnect Wallet
              </Button>
            </>
          )}
        </div>
      </div>
      <div className='content'>
        {!walletConnected ? (
          <>
            <Note label={false}>
              <Text b>Welcome to 0xWriter 👋</Text>
              <Text>Connect your wallet to get started!</Text>
            </Note>
          </>
        ) : (
          <>
            <Tabs initialValue='1'>
              <Tabs.Item label='Home' value='1'>
                <Home
                  address={address}
                  balance={balance}
                  chainId={chainId}
                  authenticated={authenticated}
                  basicProfile={basicProfile}
                  idx={idx}
                />
              </Tabs.Item>
              <Tabs.Item label='Write' value='2'>
                <Write />
              </Tabs.Item>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

window.ethereum &&
  window.ethereum.on('chainChanged', (chainId) => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1000);
  });

window.ethereum &&
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0) {
      await web3Modal.clearCachedProvider();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1000);
  });
