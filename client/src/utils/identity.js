import { PrivateKey } from '@textile/hub';
import { ethers } from 'ethers';

const generateMessageForEntropy = (ethereumAddress, applicationName) => {
  return (
    'Welcome to 0xWriter! \n' +
    '\n' +
    'The Ethereum address used by this application is: \n' +
    ethereumAddress +
    '\n' +
    '\n' +
    'By signing this message, you authorize the current application to use the following app associated with the above address: \n' +
    applicationName +
    '\n' +
    '\n' +
    'Your authentication status will be reset after 2 hours.'
  );
};

export const getIdentity = async (signer, address) => {
  try {
    let signedText;

    const message = generateMessageForEntropy(address, '0xWriter');

    signedText = await signer.signMessage(message);

    const hash = ethers.utils.keccak256(signedText);

    const seed = hash
      .replace('0x', '')
      .match(/.{2}/g)
      .map((hexNoPrefix) => ethers.BigNumber.from('0x' + hexNoPrefix).toNumber());

    const identity = PrivateKey.fromRawEd25519Seed(Uint8Array.from(seed));

    return identity;
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};
