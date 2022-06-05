import { PrivateKey } from '@textile/hub';
import { ethers } from 'ethers';

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

    throw new Error('Getting identity failed!');
  }
};

const generateMessageForEntropy = (ethereumAddress, applicationName) => {
  return `Sign message with ${ethereumAddress} to use ${applicationName}.`;
};
