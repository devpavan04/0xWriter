import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { web3Modal, connectWallet, disconectWallet } from './utils/wallet';
import LitJsSdk from 'lit-js-sdk';
import { connectCeramic } from './utils/ceramic';
import { connectThreadDB } from './utils/threadDB';
import { registerUser, getUserByDID, setUserDeployedContractAddress, getUsers } from './lib/threadDB';
import contractABI from './contracts/abi.json';
import contractAddress from './contracts/address.json';
import './app.css';
import { Button, Text, Note, useToasts, Tabs, Loading, Spacer } from '@geist-ui/core';
import { Home } from './components/Home';
import { Write } from './components/Write';
import { MyContract } from './components/MyContract';
import { WriterContract } from './components/WriterContract';
import { Read } from './components/Read';
import { AccessControl } from './components/AccessControl';

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
  const [users, setUsers] = useState();
  const [writer, setWriter] = useState();
  const [authSig, setAuthSig] = useState();
  const [litConnected, setLitConnected] = useState(false);

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

      const user = await getUserByDID(did);
      if (!user) {
        await registerUser(address, did);
        const user = await getUserByDID(did);
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
      setUsers(users);

      // List Protocol connection
      const client = new LitJsSdk.LitNodeClient();
      await client.connect();
      window.litNodeClient = client;

      const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: 'mumbai' });
      setAuthSig(authSig);
      setLitConnected(true);
    } catch (e) {
      console.log(e);

      if (e.message === 'Textile Auth Expired!' || e.message === 'Bad API key signature') {
        handleMessage('secondary', 'Textile Auth expired! Reconnect your wallet.');

        const { threadDBDisconnected, walletDisconnected } = await disconectWallet();
        if (threadDBDisconnected) setThreadDBConnected(false);
        setCeramicConnected(false);
        if (walletDisconnected) setWalletConnected(false);
      } else {
        console.log(e);

        handleMessage('error', e.message);
      }
    }
  }, []);

  return (
    <div className='wrapper'>
      <div className='header'>
        <div className='heading'>
          <Text p margin={0} className='header-text'>
            0xW
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
                ghost
                scale={0.8}
                auto
                onClick={async () => {
                  const { threadDBDisconnected, litDisconnected, walletDisconnected } = await disconectWallet();
                  if (threadDBDisconnected) setThreadDBConnected(false);
                  setCeramicConnected(false);
                  if (litDisconnected) setLitConnected(false);
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
        ) : !litConnected ? (
          <Loading type='secondary' spaceRatio={2.5} marginTop='1rem'>
            Connecting to lit protocol
          </Loading>
        ) : wallet.chainID !== 80001 ? (
          <Note width='fit-content' margin='auto' marginTop='1rem' label='Note '>
            Please connect to Mumbai Testnet.
          </Note>
        ) : (
          <>
            <Tabs initialValue='1' hideDivider align='center'>
              <Tabs.Item label='Home' value='1'>
                <Spacer h={2} />
                <Home wallet={wallet} ceramic={ceramic} handleMessage={handleMessage} />
              </Tabs.Item>
              <Tabs.Item label='My Contract' value='2'>
                <Spacer h={2} />
                <MyContract wallet={wallet} ceramic={ceramic} writer={writer} handleMessage={handleMessage} />
              </Tabs.Item>
              <Tabs.Item label='Access Control' value='3'>
                <Spacer h={2} />
                <AccessControl wallet={wallet} ceramic={ceramic} writer={writer} handleMessage={handleMessage} />
              </Tabs.Item>
              <Tabs.Item label='Write' value='4'>
                <Spacer h={1} />
                <Write
                  wallet={wallet}
                  ceramic={ceramic}
                  writer={writer}
                  authSig={authSig}
                  handleMessage={handleMessage}
                />
              </Tabs.Item>
              <Tabs.Item label='Read' value='5'>
                <Spacer h={2} />
                <Read
                  wallet={wallet}
                  ceramic={ceramic}
                  writer={writer}
                  user={user}
                  users={users}
                  handleMessage={handleMessage}
                />
              </Tabs.Item>
              <Tabs.Item label='0xWriter Contract' value='6'>
                <Spacer h={2} />
                <WriterContract wallet={wallet} ceramic={ceramic} writer={writer} handleMessage={handleMessage} />
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
