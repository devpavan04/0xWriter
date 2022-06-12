import { useState, useEffect } from 'react';
import Identicon from 'react-identicons';
import './home.css';
import { Button, Spacer, Note, Tag, Description, Modal, useModal, Input } from '@geist-ui/core';

export const Home = ({ wallet, ceramic, handleMessage }) => {
  const { address, balance } = wallet;
  const { did, store, basicProfile } = ceramic;

  const { setVisible, bindings } = useModal();

  const [name, setName] = useState();
  const [description, setDescription] = useState();
  const [emoji, setEmoji] = useState();
  const [updateProfileBtnLoading, setUpdateProfileBtnLoading] = useState(false);

  useEffect(() => {
    function init() {
      if (basicProfile !== undefined && basicProfile !== null) {
        setName(basicProfile.name);
        setDescription(basicProfile.description);
        setEmoji(basicProfile.emoji);
      }
    }
    init();
  }, []);

  const updateBasicProfile = async () => {
    try {
      if (!name) {
        handleMessage('warning', 'Please enter name.');
      } else if (!description) {
        handleMessage('warning', 'Please enter description.');
      } else if (!emoji) {
        handleMessage('warning', 'Please enter emoji.');
      } else {
        setUpdateProfileBtnLoading(true);

        await store.set('BasicProfileDefinition', {
          name,
          description,
          emoji,
        });

        setUpdateProfileBtnLoading(false);
        handleMessage('success', 'Basic Profile successfully updated.');

        setName('');
        setDescription('');
        setEmoji('');

        setVisible(false);

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setUpdateProfileBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const renderUpdateBasicProfileModal = () => {
    return (
      <Modal {...bindings} width='360px'>
        <div className='modal-content'>
          <Input clearable label='Name' value={name} onChange={(e) => setName(e.target.value)} width='100%' />
          <Input
            clearable
            label='Description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            width='100%'
          />
          <Input clearable label='Emoji' value={emoji} onChange={(e) => setEmoji(e.target.value)} width='100%' />
          {updateProfileBtnLoading ? (
            <Button type='secondary' shadow loading scale={0.8} width='100%'>
              Update Profile
            </Button>
          ) : (
            <Button type='secondary' shadow scale={0.8} width='100%' onClick={updateBasicProfile}>
              Update Profile
            </Button>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div className='home-content'>
      <div className='address-identicon'>
        <Identicon string={address} size='40' />
        <Spacer />
        <Description title='Address' content={address.substr(0, 12) + '....' + address.slice(address.length - 12)} />
      </div>
      <Description title='DID' content={did.substr(0, 14) + '....' + did.slice(did.length - 14)} />
      <Description title='Balance' content={`${balance} MATIC`} />
      <Description title='Network' content={<Tag type='lite'>Mumbai Testnet</Tag>} />
      {basicProfile !== undefined && basicProfile === null ? (
        <div className='profile-not-found'>
          <Note width='fit-content' marginTop='0' marginBottom='1' type='secondary' label={false}>
            Basic Profile not found, update now.
          </Note>
          <Button type='secondary' shadow scale={0.8} auto onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </div>
      ) : (
        <>
          <Description title='Name' content={basicProfile.name ? basicProfile.name : '--'} />
          <Description title='Description' content={basicProfile.description ? basicProfile.description : '--'} />
          <Description title='Emoji' content={basicProfile.emoji ? basicProfile.emoji : '--'} />
          <Button type='secondary' shadow scale={0.8} className='update-profile-btn' onClick={() => setVisible(true)}>
            Update Profile
          </Button>
          {renderUpdateBasicProfileModal()}
        </>
      )}
    </div>
  );
};
