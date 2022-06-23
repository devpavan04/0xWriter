import LitJsSdk from 'lit-js-sdk';

const base64StringToUint8Array = (base64String) => {
  return new Uint8Array(Buffer.from(base64String, 'base64'));
};

export const encryptedPostsBlobToBase64 = async (encryptedPostsBlob) => {
  return new Promise(function (resolve, _) {
    let reader = new FileReader();
    reader.onloadend = function () {
      return resolve(reader.result.replace('data:application/octet-stream;base64,', ''));
    };
    reader.readAsDataURL(encryptedPostsBlob);
  });
};

export const encryptedPostsBase64ToBlob = (encryptedPostsBase64String) => {
  const encryptedPostsUint8Array = (0, base64StringToUint8Array)(encryptedPostsBase64String);

  const encryptedPostsBlob = new Blob([encryptedPostsUint8Array], { type: 'application/octet-stream' });

  return encryptedPostsBlob;
};

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

    const decryptedPosts = await LitJsSdk.decryptString(encryptedPosts, symmetricKey);

    return { decryptedPosts };
  } catch (e) {
    console.log(e);

    throw new Error(e.errorCode);
  }
};
