import { useState, useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Delimiter from '@editorjs/delimiter';
import Marker from '@editorjs/marker';
import './style.css';
import { Button, Spacer, Note, Fieldset } from '@geist-ui/core';

export const Write = ({ wallet, ceramic, writer, authSig, handleMessage }) => {
  const editorInstance = useRef();

  const [userHasDeployed, setUserHasDeployed] = useState(false);
  const [accessControlConditions, setAccessControlConditions] = useState();
  const [userHasSetAccessControlConditions, setUserHasSetAccessControlConditions] = useState(false);

  useEffect(() => {
    async function init() {
      if (writer !== undefined) {
        const userHasDeployed = await writer.getHasWriterDeployed(wallet.address);
        if (userHasDeployed) {
          setUserHasDeployed(true);

          const writerData = await ceramic.store.get('writerData', ceramic.did);

          if (writerData !== undefined && writerData !== null) {
            const accessControlConditions = writerData.accessControlConditions[0];
            const minTokenCount = accessControlConditions[0].returnValueTest.value;

            if (Number(minTokenCount) > 0) {
              setAccessControlConditions(accessControlConditions);
              setUserHasSetAccessControlConditions(true);
            }
          }
        }
      }
    }
    init();
  }, [writer]);

  const openNewEditor = async () => {};
  const openEditorWithOldContent = async () => {};

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
          <Fieldset.Group value='New'>
            <Fieldset label='New'>
              {/* init a new editor and if draft init with it */}
            </Fieldset>

            <Fieldset label='My Posts'>
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
