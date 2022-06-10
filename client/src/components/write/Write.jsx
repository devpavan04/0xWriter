import { useState, useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Delimiter from '@editorjs/delimiter';
import Marker from '@editorjs/marker';
import './write.css';
import { Button, Spacer } from '@geist-ui/core';

const intitalEditorContent = () => {
  return {
    time: new Date().getTime(),
    blocks: [
      {
        type: 'header',
        data: {
          level: 1,
          text: 'Title',
        },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Tell your story...',
        },
      },
    ],
  };
};

export const Write = ({ wallet }) => {
  const editorInstance = useRef();

  useEffect(() => {
    if (!editorInstance.current) {
      let draft = window.localStorage.getItem(`editorDraft-${wallet.address}`);
      if (draft === null) {
        initializeEditor(intitalEditorContent());
      } else {
        initializeEditor(JSON.parse(draft));
      }
    }

    return () => {
      editorInstance.current.destroy();
      editorInstance.current = null;
    };
  }, []);

  const initializeEditor = (content) => {
    const editor = new EditorJS({
      holder: 'editor',
      logLevel: 'ERROR',
      data: content,
      onReady: () => {
        editorInstance.current = editor;
      },
      onChange: async () => {
        let content = await editor.saver.save();
        window.localStorage.setItem(`editorDraft-${wallet.address}`, JSON.stringify(content));
      },
      autofocus: true,
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
        },
        delimiter: Delimiter,
        marker: Marker,
      },
    });
  };

  const deleteConetnt = () => {
    let draft = window.localStorage.getItem('editorDraft');

    if (draft !== null) {
      window.localStorage.removeItem('editorDraft');
      window.location.reload();
    }
  };

  return (
    <div>
      <div id='editor'></div>
      <div className='cta'>
        <Button type='error' ghost onClick={deleteConetnt} width={0.6}>
          delete
        </Button>
        <Spacer />
        <Button type='secondary' width={0.6}>
          Save
        </Button>
      </div>
    </div>
  );
};
