import { useState, useEffect, useCallback } from 'react';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { IDX } from '@ceramicstudio/idx';
import { DID } from 'dids';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { getResolver as get3IDResolver } from '@ceramicnetwork/3id-did-resolver';
import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect';
import './app.css';
import { Button, Text, Note, useToasts, Tabs } from '@geist-ui/core';
import { Feather } from '@geist-ui/icons';
import { Home } from './components/home';
import { Write } from './components/write';

const threeID = new ThreeIdConnect();
const CERAMIC_URL = 'http://localhost:7007';

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

const App = () => {
  const { setToast } = useToasts({ placement: 'topRight', padding: '1rem' });
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
        connectWallet();
      }
    }
    init();
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const provider = await web3Modal.connect();
      setProvider(provider);
      const injectedProvider = new ethers.providers.Web3Provider(provider);
      setInjectedProvider(injectedProvider);
      const signer = injectedProvider.getSigner();
      setSigner(signer);
      const address = await signer.getAddress();
      setAddress(address);
      const balance = Number(ethers.utils.formatEther(await signer.getBalance())).toFixed(2);
      setBalance(balance);
      const chainId = await signer.getChainId();
      setChainId(chainId);
      setWalletConnected(true);
      await authenticateWithEthereum(provider, address);
    } catch (e) {
      console.log(e.message);
      toastMessage('error', 'Connection failed!');
    }
  }, []);

  const authenticateWithEthereum = async (provider, address) => {
    const authProvider = new EthereumAuthProvider(provider, address);
    await threeID.connect(authProvider);
    const ceramic = new CeramicClient();
    const did = new DID({
      provider: threeID.getDidProvider(),
      resolver: {
        ...get3IDResolver(ceramic),
        ...getKeyResolver(),
      },
    });
    await did.authenticate();
    ceramic.did = did;
    // console.log(did._id);
    setCeramic(ceramic);
    const idx = new IDX({ ceramic });
    setIDX(idx);
    setAuthenticated(true);
    const basicProfile = await idx.get('basicProfile');
    setBasicProfile(basicProfile);
    setAuthenticated(true);
  };

  const disconectWallet = async () => {
    await web3Modal.clearCachedProvider();
    setTimeout(() => {
      setWalletConnected(false);
      window.location.reload();
    }, 1000);
  };

  const toastMessage = (type, message) => {
    setToast({ type: type, text: message, delay: 2000 });
  };

  return (
    <div className='wrapper'>
      <div className='header'>
        <div className='heading'>
          <Feather size={40} />
          <Text h1>.stories</Text>
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
              <Text b>Welcome to Stories 👋</Text>
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
