import { useState, useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Delimiter from '@editorjs/delimiter';
import Marker from '@editorjs/marker';
import Paragraph from '@editorjs/paragraph';
import { encryptPostsWithLit, decryptPostsWithLit } from '../../lib/lit';
import { storeFile, retrieveFile } from '../../lib/web3-storage';
import { dataURItoBlob } from '../../utils/blob-string';
import './style.css';
import { Button, Spacer, Note, Fieldset } from '@geist-ui/core';
import { ChevronsRight, ChevronsDown } from '@geist-ui/icons';

export const Write = ({ wallet, ceramic, writer, authSig, handleMessage }) => {
  const editorJS = useRef();

  const [userHasDeployed, setUserHasDeployed] = useState(false);
  const [userAccessControlConditions, setUserAccessControlConditions] = useState();
  const [userEncryptedSymmetricKey, setUserEncryptedSymmetricKey] = useState();
  const [userEncryptedPosts, setUserEncryptedPosts] = useState();
  const [userDecryptedPosts, setUserDecryptedPosts] = useState([]);
  const [userHasSetAccessControlConditions, setUserHasSetAccessControlConditions] = useState(false);
  const [editorIsOpen, setEditorIsOpen] = useState(false);
  const [selectedPostToEditID, setSelectedPostToEditID] = useState();
  const [publishBtnLoading, setPublishBtnLoading] = useState(false);

  const initializeEditor = (editorType, content) => {
    const editor = new EditorJS({
      holder: 'editorjs',
      logLevel: 'ERROR',
      data: content,
      onReady: () => {
        editorJS.current = editor;
      },
      onChange: async () => {
        let content = await editor.saver.save();
        if (editorType === 'new') {
          window.localStorage.setItem(`editorDraft-new-${wallet.address}`, JSON.stringify(content));
        } else if (editorType === 'edit') {
          window.localStorage.setItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`, JSON.stringify(content));
        }
      },
      autofocus: false,
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
          config: {
            placeholder: 'Tell your story...',
          },
        },
        delimiter: Delimiter,
        marker: Marker,
      },
    });
  };

  // call this in the useEffect because, when reloaded user is started with new editor
  const openEditor = (editorType, content) => {
    setEditorIsOpen(true);

    if (editorType === 'new') {
      let draft = window.localStorage.getItem(`editorDraft-new-${wallet.address}`);
      if (draft === null) {
        initializeEditor(editorType);
      } else {
        initializeEditor(editorType, JSON.parse(draft));
      }
    } else if (editorType === 'edit') {
      let draft = window.localStorage.getItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);
      if (draft === null) {
        initializeEditor(editorType, content);
      } else {
        initializeEditor(editorType, JSON.parse(draft));
      }
    }
  };

  const closeEditor = () => {
    setEditorIsOpen(false);
  };

  const publishPost = async (postType) => {
    try {
      let finalDraft;

      if (postType === 'new') {
        const draft = window.localStorage.getItem(`editorDraft-new-${wallet.address}`);
        if (draft !== null) {
          finalDraft = JSON.parse(draft);
        }
      } else if (postType === 'edit') {
        const draft = window.localStorage.getItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);
        if (draft !== null) {
          finalDraft = JSON.parse(draft);
        }
      }

      if (finalDraft.blocks.length === 0) {
        handleMessage('warning', 'Cannot publish empty posts.');
      } else {
        setPublishBtnLoading(true);

        let newPosts = [...userDecryptedPosts];
        let postID;

        if (postType === 'new') {
          const newPost = {
            id: newPosts.length + 1,
            data: finalDraft.blocks,
          };

          newPosts.push(newPost);

          postID = newPost.id;
        } else if (postType === 'edit') {
          const editedPost = {
            id: Number(selectedPostToEditID),
            data: finalDraft.blocks,
          };

          newPosts[Number(selectedPostToEditID) - 1] = editedPost;

          postID = editedPost.id;
        }

        // encrypt newPosts
        const { encryptedPosts, encryptedSymmetricKey } = await encryptPostsWithLit(
          JSON.stringify(newPosts),
          userAccessControlConditions,
          authSig
        );

        // const reader = new FileReader();
        // reader.onload = async (e) => {
        //   // const b = await dataURItoBlob(event.target.result);
        // };
        // reader.readAsDataURL(encryptedPosts);

        const encryptedPostsFile = new File([encryptedPosts], `${ceramic.did}-posts.json`);
        const cid = await storeFile(encryptedPostsFile);

        console.log(cid);

        // await ceramic.store.merge('writerData', {
        //   encryptedPosts: [e.target.result],
        // });

        await ceramic.store.merge('writerData', {
          encryptedSymmetricKey: [encryptedSymmetricKey],
        });

        const wd = await ceramic.store.get('writerData', ceramic.did);
        if (wd.accessControlConditions && wd.encryptedSymmetricKey && wd.encryptedPosts) {
          const encryptedPostsFilee = await retrieveFile(cid);
          console.log(encryptedPostsFilee);
          // const userDecryptedPosts = await decryptPostsWithLit(
          //   encryptedPostsFilee,
          //   wd.encryptedSymmetricKey[0],
          //   wd.accessControlConditions[0],
          //   authSig
          // );
          // setUserDecryptedPosts(userDecryptedPosts);
          // console.log(userDecryptedPosts);
        }

        setPublishBtnLoading(false);

        if (postType === 'new') {
          handleMessage('success', 'New post successfully published!');
        } else if (postType === 'edit') {
          handleMessage('success', 'Post successfully edited!');
        }

        setSelectedPostToEditID(0);

        // setTimeout(() => {
        //   window.location.reload();
        // }, 1000);
      }
    } catch (e) {
      console.log(e);

      setPublishBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  // for new
  const clearEditor = () => {
    let draft = window.localStorage.getItem(`editorDraft-new-${wallet.address}`);

    if (draft !== null) {
      window.localStorage.removeItem(`editorDraft-new-${wallet.address}`);
      editorJS.current.clear();
    }
  };

  // for edited
  const resetEditor = () => {
    // reset to old post before changes
    let draft = window.localStorage.getItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);

    if (draft !== null) {
      window.localStorage.removeItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        if (writer !== undefined) {
          const userHasDeployed = await writer.getHasWriterDeployed(wallet.address);
          if (userHasDeployed) {
            setUserHasDeployed(true);

            const writerData = await ceramic.store.get('writerData', ceramic.did);

            if (writerData !== undefined && writerData !== null) {
              if (writerData.accessControlConditions) {
                const accessControlConditions = writerData.accessControlConditions[0];
                const minTokenCount = accessControlConditions[0].returnValueTest.value;

                if (Number(minTokenCount) > 0) {
                  setUserAccessControlConditions(accessControlConditions);
                  setUserHasSetAccessControlConditions(true);
                }
              }

              if (writerData.encryptedSymmetricKey) {
                const encryptedSymmetricKey = writerData.encryptedSymmetricKey[0];
                setUserEncryptedSymmetricKey(encryptedSymmetricKey);
              }

              if (writerData.encryptedPosts) {
                const encryptedPosts = writerData.encryptedPosts[0];
                setUserEncryptedPosts(encryptedPosts);
              }

              if (writerData.accessControlConditions && writerData.encryptedSymmetricKey && writerData.encryptedPosts) {
                console.log(writerData.encryptedPosts[0]);
                console.log(writerData.encryptedSymmetricKey[0]);
                console.log(writerData.accessControlConditions[0]);
                console.log(authSig);
                // const userDecryptedPosts = await decryptPostsWithLit(
                //   writerData.encryptedPosts[0],
                //   writerData.encryptedSymmetricKey[0],
                //   writerData.accessControlConditions[0],
                //   authSig
                // );
                // setUserDecryptedPosts(userDecryptedPosts);
                // console.log(userDecryptedPosts);

                // const obj = { hello: 'world, hello!' };
                // const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
                // const myfile = new File([blob], 'hi.json');
                // const cid = await storeFile(myfile);
                // console.log(cid);

                // bafybeifgppsayvlyrgh2vs6nluuagrpz2swame5uxl4dp5cwomkui3zaza

                const retFile = await retrieveFile('bafybeifgppsayvlyrgh2vs6nluuagrpz2swame5uxl4dp5cwomkui3zaza');
                console.log(retFile);
              }
            }
          }
        }
      } catch (e) {
        console.log(e);

        handleMessage('error', e.message);
      }
    }
    init();

    return () => {
      if (editorJS.current) {
        editorJS.current.destroy();
        editorJS.current = null;
      }
    };
  }, [writer]);

  return (
    <div className='writer-content'>
      {!userHasDeployed ? (
        <>
          <Note width='fit-content' label='Note '>
            To start writing your blog, you must first deploy an ERC20 contract (WriterERC20) to create a token gated
            access to your blog. To do that, head over to <b>My Contract</b> section.
          </Note>
        </>
      ) : userHasDeployed && !userHasSetAccessControlConditions ? (
        <>
          <Note width='fit-content' label='Note '>
            To start writing your blog, you must set an access control condition i.e, set a minimum no. of your tokens a
            user must own in order to read your blog. To do that, head over to <b>Access Control</b> section.
          </Note>
        </>
      ) : userHasDeployed && userHasSetAccessControlConditions ? (
        <>
          <Fieldset.Group value='Write'>
            <Fieldset label='Write'>
              {!editorIsOpen ? (
                <div className='editor-close-section'>
                  <div className='open-editor-btn'>
                    <ChevronsRight />
                    <Button type='secondary' shadow auto marginRight='2.8' onClick={() => openEditor('new')}>
                      Open Editor
                    </Button>
                  </div>
                </div>
              ) : editorIsOpen ? (
                <div className='editor-open-section'>
                  <div className='close-editor-btn'>
                    <ChevronsDown />
                    <Button type='secondary' ghost auto marginRight='2.8' onClick={() => closeEditor()}>
                      Close Editor
                    </Button>
                  </div>
                  <div id='editorjs'></div>
                  <div className='delete-and-save-btns'>
                    <Button type='error' ghost onClick={() => clearEditor()} auto>
                      delete
                    </Button>
                    <Button type='secondary' shadow onClick={() => publishPost('new')} auto>
                      Publish
                    </Button>
                  </div>
                </div>
              ) : null}
            </Fieldset>

            <Fieldset label='My Posts'>
              {userDecryptedPosts.length === 0 ? (
                <>
                  <Note width='fit-content' label='Note '>
                    You have not published any posts yet. To publish your first post, head over to <b>Write</b> section.
                  </Note>
                </>
              ) : userDecryptedPosts.length > 0 ? (
                'Decrypted posts.. '
              ) : null}
              {/* check if writer has previous posts - if no - then NOTE: no posts yet */}
              {/* AND */}
              {/* show all posts - cards (just post titles and a link to open in full page) - when opened in full page display the post itself and link to edit that  */}
            </Fieldset>
          </Fieldset.Group>
        </>
      ) : null}
    </div>
  );
};
