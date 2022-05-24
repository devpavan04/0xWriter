import { useState, useEffect } from 'react';
import Identicon from 'react-identicons';
import './home.css';
import {
  Card,
  Button,
  Spacer,
  Divider,
  Text,
  useToasts,
  Spinner,
  Tag,
  Description,
  Modal,
  useModal,
  Input,
} from '@geist-ui/core';

export const Home = ({ address, balance, chainId, authenticated, basicProfile, idx }) => {
  const { setToast } = useToasts({ placement: 'topRight', padding: '1rem' });
  const { setVisible, bindings } = useModal();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const updateBasicProfile = async () => {
    if (name === '') {
      toastMessage('warning', 'Please enter name.');
    } else if (description === '') {
      toastMessage('warning', 'Please enter description.');
    } else {
      toastMessage('secondary', 'Updating Basic Profile...');
      try {
        await idx.set('basicProfile', {
          name,
          description,
        });
        toastMessage('success', 'Basic Profile successfully updated.');
        toastMessage('secondary', 'Loading...');
      } catch (e) {
        toastMessage('error', 'Updating Basic Profile failed.');
      }
      setName('');
      setDescription('');
      setVisible(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const renderUpdateBasicProfileModal = () => {
    return (
      <Modal {...bindings}>
        <div className='modalContent'>
          <Input clearable label='Name' onChange={(e) => setName(e.target.value)} width='100%' />
          <Spacer />
          <Input clearable label='Description' onChange={(e) => setDescription(e.target.value)} width='100%' />
          <Spacer />
          <Button type='secondary' ghost auto onClick={updateBasicProfile}>
            Update Profile
          </Button>
        </div>
      </Modal>
    );
  };

  const toastMessage = (type, message) => {
    setToast({ type: type, text: message, delay: 2000 });
  };

  return (
    <div className='homeContent'>
      <div className='wallet'>
        <Card>
          <Card.Content>
            <Text b>Wallet</Text>
          </Card.Content>
          <Divider />
          <Card.Content>
            <div className='walletContent'>
              <div className='address'>
                <Identicon string={address} size='30' />
                <Spacer />
                <Description
                  title='Address'
                  content={address.substr(0, 5) + '...' + address.slice(address.length - 5)}
                />
              </div>
              <Spacer w={8} />
              <Description title='Balance' content={`${balance} ETH`} />
              <Spacer w={8} />
              <Description
                title='Network'
                content={
                  <Tag type='lite'>
                    {chainId === 1
                      ? 'Mainnet'
                      : chainId === 3
                      ? 'Ropsten'
                      : chainId === 4
                      ? 'Rinkeby'
                      : chainId === 42
                      ? 'Kovan'
                      : ''}
                  </Tag>
                }
              />
            </div>
          </Card.Content>
        </Card>
      </div>
      <Spacer h={2} />
      <div className='basicProfile'>
        <Card>
          <Card.Content>
            <Text b>Basic Profile</Text>
          </Card.Content>
          <Divider />
          <Card.Content>
            {!authenticated ? (
              <div className='loader'>
                <p>Authenticating DID</p>
                <Spacer />
                <Spinner />
              </div>
            ) : basicProfile === undefined ? (
              <div className='loader'>
                <p>Fetching Basic Profile</p>
                <Spacer />
                <Spinner />
              </div>
            ) : basicProfile === null ? (
              <div className='basicProfileNotFound'>
                <p>Basic Profile is not found, update now!?</p>
                <Spacer w={4} />
                <Button type='secondary' ghost auto onClick={() => setVisible(true)}>
                  Update Profile
                </Button>
                {renderUpdateBasicProfileModal()}
              </div>
            ) : (
              <div className='basicProfileContent'>
                <Description title='Name' content={basicProfile.name} />
                <Spacer w={8} />
                <Description title='Description' content={basicProfile.description} />
                <Spacer w={8} />
                <Button type='secondary' ghost auto onClick={() => setVisible(true)}>
                  Update Profile
                </Button>
                {renderUpdateBasicProfileModal()}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};