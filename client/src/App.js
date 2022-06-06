import { useState, useEffect, useCallback } from 'react';

import { web3Modal, connectWallet, disconectWallet } from './utils/wallet';
import { connectCeramic } from './utils/ceramic';
import { connectThreadDB } from './utils/threadDB';

import { registerUser, getUser, getUsers } from './lib/writer';

import './app.css';

import { Button, Text, Note, useToasts, Tabs, Loading, Spacer, Divider } from '@geist-ui/core';

import { Home } from './components/home';
import { Write } from './components/write';

const App = () => {
  const { setToast } = useToasts({ placement: 'bottomRight', padding: '1rem' });
  const handleMessage = (type, message) => {
    setToast({ type: type, text: message, delay: 6000 });
  };

  const [wallet, setWallet] = useState();
  const [walletConnected, setWalletConnected] = useState(false);
  const [ceramic, setCeramic] = useState();
  const [ceramicConnected, setCeramicConnected] = useState(false);
  const [threadDB, setThreadDB] = useState();
  const [threadDBConnected, setThreadDBConnected] = useState(false);

  const [user, setUser] = useState();
  const [users, setUsers] = useState();

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
      const { provider, injectedProvider, signer, address, balance, chainId } = await connectWallet();
      const wallet = {
        provider,
        injectedProvider,
        signer,
        address,
        balance,
        chainId,
      };
      setWallet(wallet);
      setWalletConnected(true);

      const { ceramicClient, did, idx, basicProfile } = await connectCeramic(provider, address);
      const ceramic = {
        client: ceramicClient,
        did,
        idx,
        basicProfile,
      };
      setCeramic(ceramic);
      setCeramicConnected(true);

      const { threadDBClient, threadID } = await connectThreadDB(signer, address);
      const threadDB = {
        client: threadDBClient,
        threadID,
      };
      setThreadDB(threadDB);
      setThreadDBConnected(true);

      const user = await getUser(did, threadDBClient, threadID);
      if (!user) {
        await registerUser(address, did, threadDBClient, threadID);
      }
      setUser(user);

      const users = await getUsers(threadDBClient, threadID);
      setUsers(users);
    } catch (e) {
      console.log(e);

      handleMessage('error', e.message);
    }
  }, []);

  return (
    <div className='wrapper'>
      <div className='header'>
        <div className='heading'>
          <Text h1 margin={0} className='gradient-text'>
            0xWriter
          </Text>
        </div>
        <div className='connect-buttons'>
          {!walletConnected ? (
            <Button type='secondary' auto onClick={connect}>
              Connect Wallet
            </Button>
          ) : (
            <>
              <Button
                type='secondary'
                auto
                onClick={async () => {
                  await disconectWallet();
                  setWalletConnected(false);
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
            <Note label={false} marginTop={1}>
              <Text b>Welcome to 0xWriter 👋</Text>
              <Text>Connect your wallet to get started!</Text>
            </Note>
          </>
        ) : !ceramicConnected ? (
          <Loading type='success' spaceRatio={2.5} marginTop={1}>
            Connecting to ceramic
          </Loading>
        ) : !threadDBConnected ? (
          <Loading type='success' spaceRatio={2.5} marginTop={1}>
            Connecting to textile threadDB
          </Loading>
        ) : (
          <>
            <Tabs initialValue='1' align='center'>
              <Tabs.Item label='Home' value='1'>
                <Spacer />
                <Home wallet={wallet} ceramic={ceramic} user={user} users={users} handleMessage={handleMessage} />
              </Tabs.Item>
              <Tabs.Item label='Write' value='2'>
                <Spacer />
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
