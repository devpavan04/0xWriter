import LitJsSdk from 'lit-js-sdk';

export const encryptPostsWithLit = async (posts, accessControlConditions, authSig) => {
  try {
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(posts);

    const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: 'mumbai',
    });

    return {
      encryptedPosts: encryptedString,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16'),
    };
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};

export const decryptPostsWithLit = async (encryptedPosts, encryptedSymmetricKey, accessControlConditions, authSig) => {
  try {
    const symmetricKey = await window.litNodeClient.getEncryptionKey({
      accessControlConditions,
      toDecrypt: encryptedSymmetricKey,
      chain: 'mumbai',
      authSig,
    });

    console.log(encryptedPosts);
    console.log(symmetricKey);

    const decryptedPosts = await LitJsSdk.decryptString(encryptedPosts, symmetricKey);

    return { decryptedPosts };
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};
