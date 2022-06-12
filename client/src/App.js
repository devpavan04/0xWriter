import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { web3Modal, connectWallet, disconectWallet } from './utils/wallet';
import { connectCeramic } from './utils/ceramic';
import { connectThreadDB } from './utils/threadDB';
import { registerUser, getUser, setUserDeployedContractAddress, getUsers } from './lib/writer';
import contractABI from './contracts/abi.json';
import contractAddress from './contracts/address.json';
import './app.css';
import { Button, Text, Note, useToasts, Tabs, Loading, Spacer } from '@geist-ui/core';
import { Home } from './components/Home';
import { Write } from './components/Write';
import { Contract } from './components/Contract';
import { Dashboard } from './components/Dashboard';

const App = () => {
  const { setToast } = useToasts({ placement: 'bottomRight', padding: '1rem' });
  const handleMessage = (type, message) => {
    setToast({ type: type, text: message, delay: 6000 });
  };

  const [wallet, setWallet] = useState();
  const [walletConnected, setWalletConnected] = useState(false);
  const [ceramic, setCeramic] = useState();
  const [ceramicConnected, setCeramicConnected] = useState(false);
  const [threadDBConnected, setThreadDBConnected] = useState(false);
  const [user, setUser] = useState();
  const [writer, setWriter] = useState();

  useEffect(() => {
    function init() {
      if (web3Modal.cachedProvider) {
        connect();
      }
    }
    init();
  }, []);

  const connect = useCallback(async () => {
    try {
      const { provider, injectedProvider, signer, address, balance, chainID } = await connectWallet();
      const wallet = {
        provider,
        injectedProvider,
        signer,
        address,
        balance,
        chainID,
      };
      setWallet(wallet);
      setWalletConnected(true);

      const { ceramicClient, did, store, basicProfile } = await connectCeramic(provider, address);
      const ceramic = {
        client: ceramicClient,
        did,
        store,
        basicProfile,
      };
      setCeramic(ceramic);
      setCeramicConnected(true);

      await connectThreadDB(signer, address);
      setThreadDBConnected(true);

      const user = await getUser(did);
      if (!user) {
        await registerUser(address, did);
        const user = await getUser(did);
        setUser(user);
      }
      setUser(user);

      const writer = new ethers.Contract(contractAddress.writer, contractABI.writer, signer);
      setWriter(writer);

      const userHasDeployed = await writer.getHasWriterDeployed(address);
      if (userHasDeployed) {
        const deployedContractAddress = await writer.getWriterDeployedContractAddress(address);
        await setUserDeployedContractAddress(did, deployedContractAddress);
      }

      const users = await getUsers();
      console.log(users);
    } catch (e) {
      console.log(e);

      if (e.message === 'Textile Auth Expired!' || e.message === 'Bad API key signature') {
        handleMessage('secondary', 'Textile Auth expired! Reconnect your wallet.');

        const { threadDBDisconnected, walletDisconnected } = await disconectWallet();
        if (threadDBDisconnected) setThreadDBConnected(false);
        setCeramicConnected(false);
        if (walletDisconnected) setWalletConnected(false);
      } else {
        handleMessage('error', e.message);
      }
    }
  }, []);

  return (
    <div className='wrapper'>
      <div className='header'>
        <div className='heading'>
          <Text p margin={0} className='header-text'>
            0xWriter
          </Text>
        </div>
        <div className='connect-buttons'>
          {!walletConnected ? (
            <Button type='secondary' shadow scale={0.8} auto onClick={connect}>
              Connect Wallet
            </Button>
          ) : (
            <>
              <Button
                type='secondary'
                shadow
                scale={0.8}
                auto
                onClick={async () => {
                  const { threadDBDisconnected, walletDisconnected } = await disconectWallet();
                  if (threadDBDisconnected) setThreadDBConnected(false);
                  setCeramicConnected(false);
                  if (walletDisconnected) setWalletConnected(false);
                }}
              >
                Disconnect Wallet
              </Button>
            </>
          )}
        </div>
      </div>
      <div className='content'>
        {!walletConnected ? (
          <>
            <Note label={false} type='default' marginTop='1rem'>
              <Text b>Welcome to 0xWriter 👋</Text>
              <Text>Connect your wallet to get started!</Text>
            </Note>
          </>
        ) : !ceramicConnected ? (
          <Loading type='secondary' spaceRatio={2.5} marginTop='1rem'>
            Connecting to ceramic
          </Loading>
        ) : !threadDBConnected ? (
          <Loading type='secondary' spaceRatio={2.5} marginTop='1rem'>
            Connecting to textile threadDB
          </Loading>
        ) : wallet.chainID !== 80001 ? (
          <Note width='fit-content' margin='auto' marginTop='1rem' type='secondary' label={false}>
            Please connect to Mumbai Testnet.
          </Note>
        ) : (
          <>
            <Tabs initialValue='1' hideDivider align='center'>
              <Tabs.Item label='Home' value='1'>
                <Spacer h={2} />
                <Home wallet={wallet} ceramic={ceramic} handleMessage={handleMessage} />
              </Tabs.Item>
              <Tabs.Item label='Your Contract' value='2'>
                <Spacer h={2} />
                <Contract wallet={wallet} ceramic={ceramic} user={user} writer={writer} handleMessage={handleMessage} />
              </Tabs.Item>
              <Tabs.Item label='Write' value='3'>
                <Spacer h={1} />
                <Write wallet={wallet} />
              </Tabs.Item>
              <Tabs.Item label='0xWriter Contract' value='4'>
                <Spacer h={2} />
                <Dashboard wallet={wallet} writer={writer} handleMessage={handleMessage} />
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
  window.ethereum.on('chainChanged', (chainID) => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1000);
  });

window.ethereum &&
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0) {
      const credentials = JSON.parse(localStorage.getItem('payload'));

      if (credentials !== null) {
        localStorage.removeItem('payload');
      }

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
