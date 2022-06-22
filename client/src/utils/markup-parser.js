import DOMPurify from 'dompurify';
import { Text } from '@geist-ui/core';

export const convertCleanDataToHTML = (blocks) => {
  var convertedHtml = [];
  blocks.map((block) => {
    switch (block.type) {
      case 'header':
        switch (block.data.level) {
          case 1:
            convertedHtml.push(
              <Text key={block.id} h1>
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.data.text),
                  }}
                ></span>
              </Text>
            );
            break;
          case 2:
            convertedHtml.push(
              <Text key={block.id} h2>
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.data.text),
                  }}
                ></span>
              </Text>
            );
            break;
          case 3:
            convertedHtml.push(
              <Text key={block.id} h3>
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.data.text),
                  }}
                ></span>
              </Text>
            );
            break;
          case 4:
            convertedHtml.push(
              <Text key={block.id} h4>
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.data.text),
                  }}
                ></span>
              </Text>
            );
            break;
          case 5:
            convertedHtml.push(
              <Text key={block.id} h5>
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.data.text),
                  }}
                ></span>
              </Text>
            );
            break;
          case 6:
            convertedHtml.push(
              <Text key={block.id} h6>
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.data.text),
                  }}
                ></span>
              </Text>
            );
            break;
          default:
            break;
        }
        break;
      case 'paragraph':
        convertedHtml.push(
          <Text key={block.id}>
            <span
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(block.data.text),
              }}
            ></span>
          </Text>
        );
        break;
      case 'delimiter':
        convertedHtml.push(<div key={block.id} className='ce-delimiter'></div>);
        break;
      default:
        console.log('Unknown block type', block.type);
        break;
    }
  });
  return convertedHtml;
};

export const convertToDate = (epoch) => {
  const date = new Date(epoch);
  return date.toDateString();
};
