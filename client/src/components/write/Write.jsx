import { useState, useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Delimiter from '@editorjs/delimiter';
import Marker from '@editorjs/marker';
import Paragraph from '@editorjs/paragraph';
import {
  encryptedPostsBlobToBase64,
  encryptedPostsBase64ToBlob,
  encryptPostsWithLit,
  decryptPostsWithLit,
} from '../../lib/lit';
import { convertCleanDataToHTML, convertToDate } from '../../utils/markup-parser';
import './style.css';
import { Button, Card, Note, Text, Fieldset, useToasts } from '@geist-ui/core';
import { ChevronsRight, ChevronsDown, Edit, Trash } from '@geist-ui/icons';

export const Write = ({ wallet, ceramic, writer, authSig, handleRerender, handleMessage }) => {
  const { setToast } = useToasts({ placement: 'bottomRight', padding: '1rem' });
  const [userHasDeployed, setUserHasDeployed] = useState(false);
  const [userAccessControlConditions, setUserAccessControlConditions] = useState();
  const [userEncryptedSymmetricKey, setUserEncryptedSymmetricKey] = useState();
  const [userEncryptedPosts, setUserEncryptedPosts] = useState();
  const [userDecryptedPosts, setUserDecryptedPosts] = useState([]);
  const [userHasSetAccessControlConditions, setUserHasSetAccessControlConditions] = useState(false);
  const [editorIsOpen, setEditorIsOpen] = useState(false);
  const [selectedPostToEditID, setSelectedPostToEditID] = useState();
  const [publishBtnLoading, setPublishBtnLoading] = useState(false);

  const editorJS = useRef();

  const initializeEditor = (editorType, prevContent) => {
    const editor = new EditorJS({
      holder: editorType === 'new' ? 'newEditor' : editorType === 'edit' ? 'editEditor' : 'editorjs',
      logLevel: 'ERROR',
      data: prevContent && prevContent.data !== undefined ? prevContent.data : prevContent,
      onReady: () => {
        editorJS.current = editor;
      },
      onChange: async () => {
        let content = await editor.saver.save();
        console.log(content);
        if (editorType === 'new') {
          window.localStorage.setItem(`editorDraft-new-${wallet.address}`, JSON.stringify(content));
        } else if (editorType === 'edit') {
          window.localStorage.setItem(`editorDraft-${prevContent.id}-${wallet.address}`, JSON.stringify(content));
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
      let draft = window.localStorage.getItem(`editorDraft-${content.id}-${wallet.address}`);
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

  const clearEditor = (editorType) => {
    if (editorType === 'new') {
      let draft = window.localStorage.getItem(`editorDraft-new-${wallet.address}`);

      if (draft !== null) {
        window.localStorage.removeItem(`editorDraft-new-${wallet.address}`);
        editorJS.current.clear();
      }
    } else if (editorType === 'edit') {
      let draft = window.localStorage.getItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);

      if (draft !== null) {
        window.localStorage.removeItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);
        closeEditor();
      }
    }
  };

  const resetEditor = () => {
    let draft = window.localStorage.getItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);

    if (draft !== null) {
      window.localStorage.removeItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);
    }

    closeEditor();

    editorJS.current.destroy();
    editorJS.current = null;

    const prevContentPost = userDecryptedPosts.filter((post) => post.id === Number(selectedPostToEditID));
    const prevContentPostIndex = userDecryptedPosts.indexOf(prevContentPost[0]);

    const content = userDecryptedPosts[prevContentPostIndex];

    openEditor('edit', content);
  };

  const deletePostHandler = (post) =>
    setToast({
      text: 'Are you sure you want to delete the post?',
      type: 'error',
      actions: [{ name: 'Delete', handler: () => deletePost(post) }],
    });

  const handleEdit = async (post) => {
    setSelectedPostToEditID(post.id);
    openEditor('edit', post);
  };

  const handleFieldChange = (value) => {
    if (value === 'New') {
      // openEditor('new');
    } else {
      closeEditor();
    }
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

        if (postType === 'new') {
          const newPost = {
            id: newPosts.length + 1,
            data: finalDraft,
          };

          newPosts.push(newPost);
        } else if (postType === 'edit') {
          const editedPost = {
            id: Number(selectedPostToEditID),
            data: finalDraft,
          };

          const postToEdit = newPosts.filter((post) => post.id === Number(selectedPostToEditID));
          const postToEditIndex = newPosts.indexOf(postToEdit[0]);

          newPosts[postToEditIndex] = editedPost;
        }

        const { encryptedPosts, encryptedSymmetricKey } = await encryptPostsWithLit(
          JSON.stringify(newPosts),
          userAccessControlConditions,
          authSig
        );

        const encryptedPostsBase64 = await encryptedPostsBlobToBase64(encryptedPosts);

        await ceramic.store.merge('writerData', {
          encryptedPosts: [encryptedPostsBase64],
        });

        await ceramic.store.merge('writerData', {
          encryptedSymmetricKey: [encryptedSymmetricKey],
        });

        setPublishBtnLoading(false);

        if (postType === 'new') {
          handleMessage('success', 'New post successfully published!');
        } else if (postType === 'edit') {
          handleMessage('success', 'Post successfully edited!');
        }

        if (postType === 'new') {
          clearEditor(postType);
        } else if (postType === 'edit') {
          clearEditor(postType);
        }

        setSelectedPostToEditID(0);

        handleRerender(true);
      }
    } catch (e) {
      console.log(e);

      setPublishBtnLoading(false);
      handleMessage('error', e.message);
    }
  };

  const deletePost = async (postToDelete) => {
    try {
      handleMessage('success', 'Deleting post...');

      let draft = window.localStorage.getItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);

      if (draft !== null) {
        window.localStorage.removeItem(`editorDraft-${selectedPostToEditID}-${wallet.address}`);
      }

      let newPosts = [...userDecryptedPosts];

      newPosts = newPosts.filter((post) => post.id !== postToDelete.id);

      const { encryptedPosts, encryptedSymmetricKey } = await encryptPostsWithLit(
        JSON.stringify(newPosts),
        userAccessControlConditions,
        authSig
      );

      const encryptedPostsBase64 = await encryptedPostsBlobToBase64(encryptedPosts);

      await ceramic.store.merge('writerData', {
        encryptedPosts: [encryptedPostsBase64],
      });

      await ceramic.store.merge('writerData', {
        encryptedSymmetricKey: [encryptedSymmetricKey],
      });

      handleMessage('success', 'Post successfully deleted!');

      setSelectedPostToEditID(0);

      handleRerender(true);
    } catch (e) {
      console.log(e);

      handleMessage('error', e.message);
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
                if (
                  writerData.encryptedPosts[0] &&
                  writerData.encryptedSymmetricKey[0] &&
                  writerData.accessControlConditions[0]
                ) {
                  const encryptedPostsBlob = encryptedPostsBase64ToBlob(writerData.encryptedPosts[0]);
                  const userDecryptedPosts = await decryptPostsWithLit(
                    encryptedPostsBlob,
                    writerData.encryptedSymmetricKey[0],
                    writerData.accessControlConditions[0],
                    authSig
                  );
                  setUserDecryptedPosts(JSON.parse(userDecryptedPosts.decryptedPosts));
                }
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
  }, []);

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
          <Fieldset.Group value='New' onChange={handleFieldChange}>
            <Fieldset label='New'>
              {!editorIsOpen ? (
                <div className='editor-close-section'>
                  <div className='open-editor-btn'>
                    <ChevronsRight />
                    <ChevronsRight />
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
                  <div id='newEditor'></div>
                  <div className='delete-and-save-btns'>
                    <Button type='error' ghost onClick={() => clearEditor('new')} auto>
                      delete
                    </Button>
                    {publishBtnLoading ? (
                      <Button type='secondary' shadow loading auto>
                        Publish
                      </Button>
                    ) : (
                      <Button type='secondary' shadow onClick={() => publishPost('new')} auto>
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </Fieldset>

            <Fieldset label='My Posts' paddingBottom='1'>
              {userDecryptedPosts.length === 0 ? (
                <>
                  <Note width='fit-content' label='Note '>
                    You have not published any posts yet. To publish your first post, head over to <b>New</b> section.
                  </Note>
                </>
              ) : userDecryptedPosts.length > 0 && !editorIsOpen ? (
                <div className='all-posts'>
                  {userDecryptedPosts.map((post) => {
                    return (
                      <Card key={post.id} shadow width='95%'>
                        <Card.Content>{convertCleanDataToHTML(post.data.blocks)}</Card.Content>
                        <Card.Footer>
                          <div className='card-footer'>
                            <div className='footer-text'>
                              <Text i>{convertToDate(post.data.time)}</Text>
                            </div>
                            <div className='footer-icons'>
                              <Edit className='edit-icon' onClick={() => handleEdit(post)} />
                              <Trash className='delete-icon' color='red' onClick={() => deletePostHandler(post)} />
                            </div>
                          </div>
                        </Card.Footer>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className='editor-open-section'>
                  <div className='close-editor-btn'>
                    <ChevronsDown />
                    <Button type='secondary' ghost auto marginRight='2.8' onClick={() => closeEditor()}>
                      Close Editor
                    </Button>
                  </div>
                  <div id='editEditor'></div>
                  <div className='delete-and-save-btns'>
                    <Button type='warning' ghost onClick={() => resetEditor()} auto>
                      Reset
                    </Button>
                    {publishBtnLoading ? (
                      <Button type='secondary' shadow loading auto>
                        Publish
                      </Button>
                    ) : (
                      <Button type='secondary' shadow onClick={() => publishPost('edit')} auto>
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Fieldset>
          </Fieldset.Group>
        </>
      ) : null}
    </div>
  );
};
