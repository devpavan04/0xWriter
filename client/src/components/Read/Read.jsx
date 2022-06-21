import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Identicon from 'react-identicons';
import contractABI from '../../contracts/abi.json';
import { getUsers, getUserByAddress, addSubscriber, removeSubscriber } from '../../lib/threadDB';
import './style.css';
import {
  Link,
  Badge,
  Button,
  Input,
  Description,
  Snippet,
  Text,
  Spinner,
  Fieldset,
  Card,
  Tag,
  Note,
  Breadcrumbs,
} from '@geist-ui/core';

export const Read = ({ wallet, ceramic, writer, user, users, handleUsers, handleMessage }) => {
  const [allWriters, setAllWriters] = useState([]);
  const [subscribedToWriters, setSubscribedToWriters] = useState([]);
  const [notSubscribedToWriters, setNotSubscribedToWriters] = useState([]);
  const [myWriting, setMyWriting] = useState([]);
  const [mySubscribers, setMySubscribers] = useState([]);

  const [showWritersPage, setShowWritersPage] = useState(true);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showContractPage, setShowContractPage] = useState(false);
  const [showReadPage, setShowReadPage] = useState(false);

  const [currentProfile, setCurrentProfile] = useState();

  const [userIsSubscribedToCurrentProfile, setUserIsSubscribedToCurrentProfile] = useState(false);
  const [currentProfileDecryptedPosts, setCurrentProfileDecryptedPosts] = useState();

  const [newMint, setNewMint] = useState();
  const [mintBtnLoading, setMintBtnLoading] = useState(false);

  const [transferAddress, setTransferAddress] = useState();
  const [transferAmount, setTransferAmount] = useState();
  const [transferBtnLoading, setTransferBtnLoading] = useState(false);

  const handleShowWritersPage = () => {
    setCurrentProfile({});
    setShowProfilePage(false);
    setShowContractPage(false);
    setShowReadPage(false);

    setShowWritersPage(true);
  };

  const handleShowProfilePage = (writer) => {
    setCurrentProfile(writer);
    setShowWritersPage(false);
    setShowContractPage(false);
    setShowReadPage(false);

    setShowProfilePage(true);
  };

  const handleShowContractPage = () => {
    setShowWritersPage(false);
    setShowProfilePage(false);
    setShowReadPage(false);

    setShowContractPage(true);
  };

  const handleShowReadPage = () => {
    setShowWritersPage(false);
    setShowProfilePage(false);
    setShowContractPage(false);

    setShowReadPage(true);
  };

  const mintNewTokens = async (writer) => {
    try {
      if (!newMint) {
        handleMessage('warning', 'Please enter no. of tokens.');
      } else if (Number(newMint) <= 0) {
        handleMessage('warning', 'No. of tokens should be atleast 1.');
      } else {
        setMintBtnLoading(true);

        let mintPrice = await writer.writerERC20.getTokenPrice();
        mintPrice = String(mintPrice * newMint);

        const txn = await writer.writerERC20.mint(Number(newMint), { value: mintPrice });

        const receipt = await txn.wait();

        if (receipt.status === 1) {
          handleMessage('success', 'Transaction successful!');
          handleMessage('success', 'Updating user on threadDB...');
        } else {
          setMintBtnLoading(false);
          handleMessage('error', 'Transaction failed!');
        }

        const loggedInUserBalanceOfWriterToken = await writer.writerERC20.balanceOf(wallet.address);
        const writerRequiredNoOfTokensToAccess = writer.accessControlConditions[0].returnValueTest.value;
        if (Number(loggedInUserBalanceOfWriterToken) >= Number(writerRequiredNoOfTokensToAccess)) {
          await addSubscriber(writer.did, ceramic.did);
        } else {
          await removeSubscriber(writer.did, ceramic.did);
        }

        handleMessage('success', 'User updated on threadDB!');
        setMintBtnLoading(false);

        setNewMint('');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setMintBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const transferTokens = async (writer) => {
    try {
      if (!transferAddress) {
        handleMessage('warning', 'Please enter transfer address.');
      } else if (!ethers.utils.isAddress(transferAddress)) {
        handleMessage('warning', 'Please enter valid address.');
      } else if (!transferAmount) {
        handleMessage('warning', 'Please enter no. of tokens');
      } else if (Number(transferAmount) <= 0) {
        handleMessage('warning', 'No. of tokens should be atleast 1.');
      } else {
        setTransferBtnLoading(true);

        const txn = await writer.writerERC20.transfer(transferAddress, Number(transferAmount));

        const receipt = await txn.wait();

        if (receipt.status === 1) {
          handleMessage('success', 'Transaction successful!');
          handleMessage('success', 'Updating user on threadDB...');
        } else {
          setTransferBtnLoading(false);
          handleMessage('error', 'Transaction failed!');
        }

        const loggedInUserBalanceOfWriterToken = await writer.writerERC20.balanceOf(wallet.address);
        const writerRequiredNoOfTokensToAccess = writer.accessControlConditions[0].returnValueTest.value;
        if (Number(loggedInUserBalanceOfWriterToken) >= Number(writerRequiredNoOfTokensToAccess)) {
          await addSubscriber(writer.did, ceramic.did);
        } else {
          await removeSubscriber(writer.did, ceramic.did);
        }

        const transferToUserBalanceOfWriterToken = await writer.writerERC20.balanceOf(transferAddress);
        const transferToUser = await getUserByAddress(transferAddress);
        if (Number(transferToUserBalanceOfWriterToken) >= Number(writerRequiredNoOfTokensToAccess)) {
          await addSubscriber(writer.did, transferToUser.did);
        } else {
          await removeSubscriber(writer.did, transferToUser.did);
        }

        handleMessage('success', 'User updated on threadDB!');
        setTransferBtnLoading(false);

        setTransferAddress('');
        setTransferAmount('');

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.log(e);

      setTransferBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  useEffect(() => {
    async function init() {
      if (writer !== undefined && users !== undefined) {
        const writerUsers = users.filter(
          (user) => user.deployedContractAddress !== '' && user.deployedContractAddress !== ethers.constants.AddressZero
        );

        const allWriters = await Promise.all(
          writerUsers.map(async (writerUser) => {
            const writerData = await ceramic.store.get('writerData', writerUser.did);

            if (writerData !== undefined && writerData !== null) {
              if (writerData.accessControlConditions !== undefined && writerData.accessControlConditions[0] !== null) {
                let userData = {
                  address: writerUser.address,
                  did: writerUser.did,
                  contractAddress: writerUser.deployedContractAddress,
                  subscribedBy: writerUser.subscribedBy,
                  subscribedTo: writerUser.subscribedTo,
                };

                if (writerData.encryptedPosts !== undefined && writerData.encryptedPosts[0] !== null) {
                  userData.encryptedPosts = writerData.encryptedPosts[0];
                }

                if (writerData.encryptedSymmetricKey !== undefined && writerData.encryptedSymmetricKey[0] !== null) {
                  userData.encryptedSymmetricKey = writerData.encryptedSymmetricKey[0];
                }

                userData.accessControlConditions = writerData.accessControlConditions[0];

                userData.totalSubscribedBy = writerUser.subscribedBy.length;
                userData.totalSubscribedTo = writerUser.subscribedTo.length;

                const basicProfile = await ceramic.store.get('basicProfile', writerUser.did);
                if (basicProfile !== undefined && basicProfile !== null) {
                  userData.name = basicProfile.name;
                  userData.description = basicProfile.description;
                  userData.emoji = basicProfile.emoji;
                }

                const writerERC20 = new ethers.Contract(
                  writerUser.deployedContractAddress,
                  contractABI.writerERC20,
                  wallet.signer
                );
                userData.writerERC20 = writerERC20;

                userData.tokenName = await writerERC20.name();
                userData.tokenSymbol = await writerERC20.symbol();
                userData.tokenPrice = ethers.utils.formatEther(await writerERC20.getTokenPrice());

                const loggedInUserBalanceOfWriterToken = await writerERC20.balanceOf(wallet.address);
                userData.loggedInUserBalanceOfWriterToken = Number(loggedInUserBalanceOfWriterToken);

                const writerRequiredNoOfTokensToAccess = writerData.accessControlConditions[0][0].returnValueTest.value;
                userData.writerRequiredNoOfTokensToAccess = Number(writerRequiredNoOfTokensToAccess);

                // const allUsers = users;
                // await Promise.all(
                //   allUsers.map(async (user) => {
                //     const userBalanceOfWriterToken = await writerERC20.balanceOf(user.address);

                //     if (Number(userBalanceOfWriterToken) >= Number(writerRequiredNoOfTokensToAccess)) {
                //       await addSubscriber(writerUser.did, user.did);
                //     } else {
                //       await removeSubscriber(writerUser.did, user.did);
                //     }
                //   })
                // );

                if (Number(loggedInUserBalanceOfWriterToken) >= Number(writerRequiredNoOfTokensToAccess)) {
                  await addSubscriber(writerUser.did, ceramic.did);
                  if (writerUser.did === ceramic.did) {
                    userData.loggedInUserIsSubscribed = 'owner';
                  } else {
                    userData.loggedInUserIsSubscribed = 'yes';
                  }
                } else {
                  await removeSubscriber(writerUser.did, ceramic.did);
                  userData.loggedInUserIsSubscribed = 'no';
                }

                // address
                // did
                // contractAddress
                // subscribedBy
                // subscribedTo
                // encryptedPosts
                // encryptedSymmetricKey
                // accessControlConditions
                // totalSubscribedBy
                // totalSubscribedTo
                // name
                // description
                // emoji
                // writerERC20
                // tokenName
                // tokenSymbol
                // tokenPrice
                // loggedInUserBalanceOfWriterToken
                // writerRequiredNoOfTokensToAccess
                // loggedInUserIsSubscribed

                return userData;
              }
            }
          })
        );

        setAllWriters(allWriters);

        const updatedUsers = await getUsers();
        if (users !== updatedUsers) {
          handleUsers(updatedUsers);
        }

        // const subscribedToWriters = allWriters.filter((writer) => writer.subscribedTo.includes(ceramic.did));
        // setSubscribedToWriters(subscribedToWriters);

        // const notSubscribedToWriters = allWriters.filter((writer) => !writer.subscribedTo.includes(ceramic.did));
        // setNotSubscribedToWriters(notSubscribedToWriters);

        // const myWriting = allWriters.filter((writer) => writer.did === ceramic.did);
        // setMyWriting(myWriting);

        // if (myWriting[0]) {
        //   const mySubscribers = await Promise.all(
        //     myWriting[0].subscribedBy.map(async (did) => {
        //       let subscriberData = {
        //         did: did,
        //       };

        //       const user = await getUserByDID(did);
        //       subscriberData.address = user.address;

        //       const basicProfile = await ceramic.store.get('basicProfile', did);
        //       if (basicProfile !== undefined && basicProfile !== null) {
        //         subscriberData.name = basicProfile.name;
        //         subscriberData.description = basicProfile.description;
        //         subscriberData.emoji = basicProfile.emoji;
        //       }

        //       return subscriberData;
        //     })
        //   );
        //   setMySubscribers(mySubscribers);
        // }
      }
    }
    init();
  }, [writer, user, users, currentProfile]);

  return (
    <div className='writers'>
      <Fieldset.Group value='All Writers'>
        <Fieldset label='All Writers' paddingRight='2.6'>
          {showWritersPage && !showProfilePage && !showContractPage && !showReadPage ? (
            <div className='all-writers'>
              {allWriters.length < 1 ? (
                <Spinner />
              ) : (
                <>
                  <div className='all-writers-cards'>
                    {allWriters.map((writer) => {
                      if (writer) {
                        return (
                          <Card
                            key={writer.address}
                            type='lite'
                            style={{ backgroundColor: writer.address === wallet.address ? '#eef' : '' }}
                            shadow
                            width='100%'
                          >
                            <div className='writer'>
                              <div className='writer-details-all'>
                                <div className='writer-identicon-profile'>
                                  <div className='writer-identicon'>
                                    <Identicon
                                      string={writer.address}
                                      bg={writer.address === wallet.address ? '#fff' : '#eef'}
                                      size='40'
                                    />
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
                                    <Badge scale={0.8} marginBottom='0.7' style={{ backgroundColor: 'darkgreen' }}>
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
                                <Link href={'#'} icon onClick={() => handleShowProfilePage(writer)}>
                                  {writer.address === wallet.address ? 'Your Profile' : 'View Profile'}
                                </Link>
                              </div>
                            </div>
                          </Card>
                        );
                      }
                    })}
                  </div>
                </>
              )}
            </div>
          ) : !showWritersPage && showProfilePage && currentProfile !== undefined ? (
            <div className='profile-content'>
              <Card
                key={currentProfile.address}
                style={{ backgroundColor: currentProfile.address === wallet.address ? '#eef' : '' }}
                shadow
                width='100%'
              >
                <div className='writer'>
                  <div className='breadcrumbs-writer-card-top-right'>
                    <div className='breadcrumbs'>
                      <Breadcrumbs>
                        <Breadcrumbs.Item href='#' onClick={handleShowWritersPage}>
                          All Writers
                        </Breadcrumbs.Item>
                        <Breadcrumbs.Item>Writer</Breadcrumbs.Item>
                      </Breadcrumbs>
                    </div>
                    <div className='writer-card-top-right'>
                      <Badge.Anchor>
                        <Badge scale={0.8} marginBottom='0.7' style={{ backgroundColor: 'darkgreen' }}>
                          {currentProfile.totalSubscribedBy > 1000 ? '1k+' : currentProfile.totalSubscribedBy}
                        </Badge>
                        <Tag type='dark' scale={0.9}>
                          Subscribers
                        </Tag>
                      </Badge.Anchor>
                      {currentProfile.loggedInUserIsSubscribed ===
                      'owner' ? null : currentProfile.loggedInUserIsSubscribed === 'yes' ? (
                        <Badge.Anchor>
                          <Tag style={{ backgroundColor: 'darkgreen', color: 'white' }} scale={0.9}>
                            Subscribed
                          </Tag>
                        </Badge.Anchor>
                      ) : currentProfile.loggedInUserIsSubscribed === 'no' ? (
                        <Badge.Anchor>
                          <Tag
                            type='dark'
                            className='subscribe-btn'
                            onClick={() => handleShowContractPage()}
                            invert
                            scale={0.9}
                          >
                            Subscribe
                          </Tag>
                        </Badge.Anchor>
                      ) : null}
                    </div>
                  </div>
                  <div className='writer-details-profile'>
                    <div className='writer-identicon-profile'>
                      <div className='writer-identicon'>
                        <Identicon
                          string={currentProfile.address}
                          bg={currentProfile.address === wallet.address ? '#fff' : '#eef'}
                          size='40'
                        />
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
                    <div className='writer-address-did'>
                      <div className='writer-did'>
                        <Snippet symbol='DID' text={currentProfile.did} width='400px' copy='prevent' />
                      </div>
                      <div className='writer-address'>
                        <Snippet type='lite' symbol='Address' text={currentProfile.address} width='400px' />
                      </div>
                    </div>
                    {/* <div className='writer-deployed-contract-address'>
                      <Text>Deployed Contract Address :</Text>
                      <Link
                        href={`https://mumbai.polygonscan.com/address/${currentProfile.contractAddress}`}
                        target={'_blank'}
                        icon
                        style={{ color: '#7B3FE4', fontWeight: 'bold' }}
                      >
                        Polygonscan
                      </Link>
                    </div> */}
                  </div>
                  <div className='view-read-contract'>
                    <Link href={'#'} icon onClick={() => handleShowReadPage()}>
                      Read Blog
                    </Link>
                    {currentProfile.loggedInUserIsSubscribed !== 'owner' ? (
                      <Link href={'#'} icon onClick={() => handleShowContractPage()}>
                        Contract
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            </div>
          ) : !showWritersPage && !showProfilePage && showContractPage && currentProfile !== undefined ? (
            <div className='contract-content'>
              <Card key={currentProfile.address} shadow width='100%'>
                <div className='contract-card-items'>
                  <div className='breadcrumbs'>
                    <Breadcrumbs>
                      <Breadcrumbs.Item href='#' onClick={handleShowWritersPage}>
                        All Writers
                      </Breadcrumbs.Item>
                      <Breadcrumbs.Item href='#' onClick={() => handleShowProfilePage(currentProfile)}>
                        Writer
                      </Breadcrumbs.Item>
                      <Breadcrumbs.Item>Contract</Breadcrumbs.Item>
                    </Breadcrumbs>
                  </div>
                  <div className='contract-note'>
                    {currentProfile.loggedInUserIsSubscribed === 'no' ? (
                      <Note width='fit-content' type='error' label='Note '>
                        Looks like you are short of{' '}
                        {currentProfile.writerRequiredNoOfTokensToAccess -
                          currentProfile.loggedInUserBalanceOfWriterToken}{' '}
                        {currentProfile.tokenSymbol} Tokens. Mint atleast{' '}
                        {currentProfile.writerRequiredNoOfTokensToAccess -
                          currentProfile.loggedInUserBalanceOfWriterToken}{' '}
                        {currentProfile.tokenSymbol} tokens below to get subscribed to the writer.
                      </Note>
                    ) : (
                      <Note width='fit-content' label='Info '>
                        Here you can mint {currentProfile.tokenSymbol} tokens to get subscribed to the writer and also
                        transfer them to other addresses.
                      </Note>
                    )}
                  </div>
                  <div className='token-reads-and-writes'>
                    <div className='token-reads'>
                      <Description
                        title='Contract'
                        content={
                          !currentProfile.contractAddress ? (
                            <Spinner />
                          ) : (
                            <Link
                              href={`https://mumbai.polygonscan.com/address/${currentProfile.contractAddress}`}
                              target={'_blank'}
                              icon
                              style={{ color: '#7B3FE4', fontWeight: 'bold' }}
                            >
                              Polygonscan
                            </Link>
                          )
                        }
                      />
                      <Description
                        title='Token Name'
                        content={!currentProfile.tokenName ? <Spinner /> : currentProfile.tokenName}
                      />
                      <Description
                        title='Token Symbol'
                        content={!currentProfile.tokenSymbol ? <Spinner /> : currentProfile.tokenSymbol}
                      />
                      <Description
                        title='Token Price'
                        content={!currentProfile.tokenPrice ? <Spinner /> : currentProfile.tokenPrice}
                      />
                      <Description
                        title='Your Token Balance'
                        content={currentProfile.loggedInUserBalanceOfWriterToken}
                      />
                    </div>
                    <div className='token-writes'>
                      <div className='token-write'>
                        <Input
                          clearable
                          type='secondary'
                          placeholder='No. of tokens: 1000'
                          onChange={(e) => setNewMint(e.target.value)}
                          width='80%'
                        >
                          Mint New Tokens
                        </Input>
                        {mintBtnLoading ? (
                          <Button type='secondary' shadow loading className='btn' scale={0.8}>
                            Mint
                          </Button>
                        ) : (
                          <Button
                            type='secondary'
                            shadow
                            className='btn'
                            scale={0.8}
                            onClick={() => mintNewTokens(currentProfile)}
                          >
                            Mint
                          </Button>
                        )}
                      </div>
                      <div className='token-write'>
                        <Input
                          clearable
                          type='secondary'
                          placeholder='To Address: 0x0'
                          onChange={(e) => setTransferAddress(e.target.value)}
                          width='80%'
                        >
                          Transfer Tokens
                        </Input>
                        <Input
                          clearable
                          type='secondary'
                          placeholder='No.of tokens: 30'
                          onChange={(e) => setTransferAmount(e.target.value)}
                          width='80%'
                        />
                        {transferBtnLoading ? (
                          <Button type='secondary' shadow loading className='btn' scale={0.8}>
                            Transfer
                          </Button>
                        ) : (
                          <Button
                            type='secondary'
                            shadow
                            className='btn'
                            scale={0.8}
                            onClick={() => transferTokens(currentProfile)}
                          >
                            Transfer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : !showWritersPage &&
            !showProfilePage &&
            !showContractPage &&
            showReadPage &&
            currentProfile !== undefined ? (
            <div className='read-content'>
              <Card key={currentProfile.address} shadow width='100%'>
                Read
                <Breadcrumbs>
                  <Breadcrumbs.Item href='#' onClick={handleShowWritersPage}>
                    All Writers
                  </Breadcrumbs.Item>
                  <Breadcrumbs.Item href='#' onClick={() => handleShowProfilePage(currentProfile)}>
                    Writer
                  </Breadcrumbs.Item>
                  <Breadcrumbs.Item>Read</Breadcrumbs.Item>
                </Breadcrumbs>
              </Card>
            </div>
          ) : null}
        </Fieldset>

        <Fieldset label='My Subscriptions'></Fieldset>
        <Fieldset label='My Subscribers'></Fieldset>
      </Fieldset.Group>
    </div>
  );
};
