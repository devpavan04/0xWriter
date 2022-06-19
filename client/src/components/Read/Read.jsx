import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Identicon from 'react-identicons';
import contractABI from '../../contracts/abi.json';
import { getUserByDID } from '../../lib/threadDB';
import './style.css';
import { Link, Badge, Button, Spacer, Snippet, Text, Spinner, Fieldset, Card, Tag } from '@geist-ui/core';
import { CheckInCircleFill, ChevronLeft } from '@geist-ui/icons';

export const Read = ({ wallet, ceramic, writer, user, users, handleMessage }) => {
  const [allWriters, setAllWriters] = useState([]);
  const [subscribedToWriters, setSubscribedToWriters] = useState([]);
  const [notSubscribedToWriters, setNotSubscribedToWriters] = useState([]);
  const [myWriting, setMyWriting] = useState([]);
  const [mySubscribers, setMySubscribers] = useState([]);

  const [showWritersPage, setShowWritersPage] = useState(true);
  const [showProfilePage, setShowProfilePage] = useState(false);

  const [currentProfile, setCurrentProfile] = useState();

  useEffect(() => {
    async function init() {
      if (writer !== undefined && users !== undefined) {
        const writerUsers = users.filter(
          (user) => user.deployedContractAddress !== '' && user.deployedContractAddress !== ethers.constants.AddressZero
        );

        const allWriters = await Promise.all(
          writerUsers.map(async (user) => {
            let userData = {
              address: user.address,
              did: user.did,
              contractAddress: user.deployedContractAddress,
              subscribedBy: user.subscribedBy,
              subscribedTo: user.subscribedTo,
            };

            userData.totalSubscribedBy = user.subscribedBy.length;
            userData.totalSubscribedTo = user.subscribedTo.length;

            const basicProfile = await ceramic.store.get('basicProfile', user.did);
            if (basicProfile !== undefined && basicProfile !== null) {
              userData.name = basicProfile.name;
              userData.description = basicProfile.description;
              userData.emoji = basicProfile.emoji;
            }

            const writerData = await ceramic.store.get('writerData', user.did);
            if (writerData !== undefined && writerData !== null) {
              userData.encryptedPosts = writerData.encryptedPosts;
              userData.encryptedSymmetricKey = writerData.encryptedSymmetricKey;
              userData.accessControlConditions = writerData.accessControlConditions;
            }

            const writerERC20 = new ethers.Contract(
              user.deployedContractAddress,
              contractABI.writerERC20,
              wallet.signer
            );
            userData.writerERC20 = writerERC20;

            userData.tokenName = await writerERC20.name();
            userData.tokenSymbol = await writerERC20.symbol();
            userData.tokenPrice = ethers.utils.formatEther(await writerERC20.getTokenPrice());

            return userData;
            // subscribe btn (opens page to mint that person's token) (mint for self, gift (transfer) to someone else)
            // read btn (opens page of the content)
          })
        );

        setAllWriters(allWriters);

        const subscribedToWriters = allWriters.filter((writer) => writer.subscribedTo.includes(ceramic.did));
        setSubscribedToWriters(subscribedToWriters);

        const notSubscribedToWriters = allWriters.filter((writer) => !writer.subscribedTo.includes(ceramic.did));
        setNotSubscribedToWriters(notSubscribedToWriters);

        const myWriting = allWriters.filter((writer) => writer.did === ceramic.did);
        setMyWriting(myWriting);

        if (myWriting[0]) {
          const mySubscribers = await Promise.all(
            myWriting[0].subscribedBy.map(async (did) => {
              let subscriberData = {
                did: did,
              };

              const user = await getUserByDID(did);
              subscriberData.address = user.address;

              const basicProfile = await ceramic.store.get('basicProfile', did);
              if (basicProfile !== undefined && basicProfile !== null) {
                subscriberData.name = basicProfile.name;
                subscriberData.description = basicProfile.description;
                subscriberData.emoji = basicProfile.emoji;
              }

              return subscriberData;
            })
          );
        }

        setMySubscribers(mySubscribers);
      }
    }
    init();
  }, [writer, user, users, currentProfile]);

  const openProfile = (writer) => {
    setCurrentProfile(writer);
    setShowWritersPage(false);
    setShowProfilePage(true);
  };

  const closeProfile = () => {
    setCurrentProfile({});
    setShowProfilePage(false);
    setShowWritersPage(true);
  };

  return (
    <div className='writers'>
      <Fieldset.Group value='All Writers'>
        <Fieldset label='All Writers' paddingRight='2.6'>
          {/* TODO: All writers page */}
          {showWritersPage ? (
            <div className='all-writers'>
              {allWriters.length < 1 ? (
                <Spinner />
              ) : (
                allWriters.map((writer) => {
                  return (
                    <Card key={writer.address} shadow width='100%'>
                      <div className='writer'>
                        <div className='writer-details'>
                          <div className='writer-identicon-profile'>
                            <div className='writer-identicon'>
                              <Identicon string={writer.address} bg='#eef' size='40' />
                            </div>
                            <div className='writer-basic-profile'>
                              <div className='writer-name'>
                                {writer.name ? (
                                  <Text margin='0' b>
                                    {writer.name}
                                  </Text>
                                ) : (
                                  <Text margin='0'>--</Text>
                                )}
                              </div>
                              <div className='writer-description'>
                                <Text margin='0'>{writer.description ? writer.description : '--'}</Text>
                              </div>
                              <div className='writer-emoji'>
                                <Text margin='0'>{writer.emoji ? writer.emoji : '--'}</Text>
                              </div>
                            </div>
                          </div>
                          <div className='writer-card-top-right'>
                            <Badge.Anchor>
                              <Badge scale={0.8} marginBottom='0.7' type='default'>
                                {writer.subscribedBy.length > 1000 ? '1k+' : writer.subscribedBy.length}
                              </Badge>
                              <Tag type='dark' scale={0.8}>
                                Subscribers
                              </Tag>
                            </Badge.Anchor>
                          </div>
                        </div>
                        <div className='writer-address-did'>
                          <div className='writer-did'>
                            <Snippet symbol='DID' text={writer.did} width='400px' copy='prevent' />
                          </div>
                          <div className='writer-address'>
                            <Snippet type='lite' symbol='Address' text={writer.address} width='400px' />
                          </div>
                        </div>
                        <div className='view-profile'>
                          <Link href={'#'} icon onClick={() => openProfile(writer)}>
                            Read
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          ) : null}
          {/* TODO: Profile page */}
          {showProfilePage && currentProfile !== undefined ? (
            <div className='profile-content'>
              <Card key={currentProfile.address} shadow width='100%'>
                <div className='writer'>
                  <div className='back-btn-writer-card-top-right'>
                    <Link className='back-click' href='#' onClick={closeProfile}>
                      {' '}
                      <ChevronLeft />
                      <Text>Back</Text>
                    </Link>
                    <div className='writer-card-top-right'>
                      <Badge.Anchor>
                        <Badge scale={0.8} marginBottom='0.7'>
                          {currentProfile.subscribedBy.length > 1000 ? '1k+' : currentProfile.subscribedBy.length}
                        </Badge>
                        <Tag type='dark' scale={0.9}>
                          Subscribers
                        </Tag>
                      </Badge.Anchor>
                      <Badge.Anchor>
                        <Tag style={{ background: 'green' }} invert scale={0.9}>
                          Subscribed
                        </Tag>
                      </Badge.Anchor>
                    </div>
                  </div>
                  <div className='writer-details'>
                    <div className='writer-identicon-profile'>
                      <div className='writer-identicon'>
                        <Identicon string={currentProfile.address} bg='#eef' size='40' />
                      </div>
                      <div className='writer-basic-profile'>
                        <div className='writer-name'>
                          {currentProfile.name ? (
                            <Text margin='0' b>
                              {currentProfile.name}
                            </Text>
                          ) : (
                            <Text margin='0'>--</Text>
                          )}
                        </div>
                        <div className='writer-description'>
                          <Text margin='0'>{currentProfile.description ? currentProfile.description : '--'}</Text>
                        </div>
                        <div className='writer-emoji'>
                          <Text margin='0'>{currentProfile.emoji ? currentProfile.emoji : '--'}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='writer-address-did'>
                    <div className='writer-did'>
                      <Snippet symbol='DID' text={currentProfile.did} width='400px' copy='prevent' />
                    </div>
                    <div className='writer-address'>
                      <Snippet type='lite' symbol='Address' text={currentProfile.address} width='400px' />
                    </div>
                  </div>
                  <div className='writer-deployed-contract-address'>
                    <Text>Deployed Contract Address :</Text>
                    <Link
                      href={`https://mumbai.polygonscan.com/address/${currentProfile.contractAddress}`}
                      target={'_blank'}
                      icon
                      style={{ color: '#7B3FE4', fontWeight: 'bold' }}
                    >
                      Polygonscan
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
          {/* Subscribe Page (buy tokens page) --> shown when manage your writer's token is clicked and when subscribe btn is clicked */}

          {/* Read page */}
        </Fieldset>

        <Fieldset label='My Subscriptions'></Fieldset>

        <Fieldset label='My Subscribers'></Fieldset>
      </Fieldset.Group>
    </div>
  );
};
