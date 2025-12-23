import FilePreview from '@/components/business-component/FilePreview';
import { Divider, Space, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

/**
 * Demo for FilePreview component
 * Supports multiple file types preview
 */
const FilePreviewDemo: React.FC = () => {
  // Test files
  const testFiles = {
    // Documents
    docx: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.docx',
    xlsx: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.xlsx',
    pdf: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.pdf',
    pptx: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.pptx',
    // Media
    image: 'https://picsum.photos/800/600',
    images: [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3',
    ],
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    // Text-based
    markdown: 'https://raw.githubusercontent.com/facebook/react/main/README.md',
    json: 'https://jsonplaceholder.typicode.com/posts/1',
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>FilePreview Component Demo</Title>
      <Text type="secondary">
        Supports DOCX, XLSX, PPTX, PDF, Image, Audio, Video, HTML, Markdown,
        Text and more
      </Text>

      <Divider />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Image Preview - Single */}
        <div>
          <Title level={4}>Image Preview (Single)</Title>
          <FilePreview
            src={testFiles.image}
            height={400}
            showDownload
            onRendered={() => console.log('Image rendered')}
            onError={(e) => console.error('Image error:', e)}
          />
        </div>

        {/* Image Preview - Gallery */}
        <div>
          <Title level={4}>Image Preview (Gallery - Multiple)</Title>
          <FilePreview
            srcList={testFiles.images}
            height={400}
            showDownload
            onRendered={() => console.log('Image gallery rendered')}
          />
        </div>

        {/* Audio Preview */}
        <div>
          <Title level={4}>Audio Preview</Title>
          <FilePreview
            src={testFiles.audio}
            height={200}
            showDownload
            onRendered={() => console.log('Audio rendered')}
          />
        </div>

        {/* Video Preview */}
        <div>
          <Title level={4}>Video Preview</Title>
          <FilePreview
            src={testFiles.video}
            height={400}
            showDownload
            onRendered={() => console.log('Video rendered')}
          />
        </div>

        {/* HTML Preview */}
        <div>
          <Title level={4}>HTML Preview</Title>
          <FilePreview
            src={
              new Blob(
                [
                  `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; color: #fff; }
    h1 { margin-bottom: 20px; }
    .card { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px); }
    button { padding: 10px 20px; background: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    button:hover { background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>🎉 HTML Preview Demo</h1>
  <div class="card">
    <p>This is an HTML file rendered in a sandboxed iframe.</p>
    <p>Supports CSS styles and basic JavaScript.</p>
    <button onclick="alert('Hello from HTML preview!')">Click me</button>
  </div>
</body>
</html>`,
                ],
                { type: 'text/html' },
              )
            }
            fileType="html"
            height={350}
            showDownload
            downloadFileName="demo.html"
            onRendered={() => console.log('HTML rendered')}
          />
        </div>

        {/* Markdown Preview */}
        <div>
          <Title level={4}>Markdown Preview</Title>
          <FilePreview
            src={testFiles.markdown}
            height={400}
            showDownload
            onRendered={() => console.log('Markdown rendered')}
          />
        </div>

        {/* JSON/Text Preview */}
        <div>
          <Title level={4}>JSON/Text Preview</Title>
          <FilePreview
            src={testFiles.json}
            fileType="text"
            height={300}
            showDownload
            onRendered={() => console.log('JSON rendered')}
          />
        </div>

        <Divider>Document Previews</Divider>

        {/* DOCX Preview */}
        <div>
          <Title level={4}>DOCX Preview</Title>
          <FilePreview
            src={testFiles.docx}
            height={400}
            showDownload
            onRendered={() => console.log('DOCX rendered')}
            onError={(e) => console.error('DOCX error:', e)}
          />
        </div>

        {/* XLSX Preview */}
        <div>
          <Title level={4}>XLSX Preview</Title>
          <FilePreview
            src={testFiles.xlsx}
            height={400}
            showDownload
            onRendered={() => console.log('XLSX rendered')}
            onError={(e) => console.error('XLSX error:', e)}
          />
        </div>

        {/* PDF Preview */}
        <div>
          <Title level={4}>PDF Preview</Title>
          <FilePreview
            src={testFiles.pdf}
            height={600}
            showDownload
            onRendered={() => console.log('PDF rendered')}
            onError={(e) => console.error('PDF error:', e)}
          />
        </div>

        {/* PPTX Preview */}
        <div>
          <Title level={4}>PPTX Preview</Title>
          <FilePreview
            src={testFiles.pptx}
            height={500}
            showDownload
            onRendered={() => console.log('PPTX rendered')}
            onError={(e) => console.error('PPTX error:', e)}
          />
        </div>

        <Divider>Special States</Divider>

        {/* Unsupported File */}
        <div>
          <Title level={4}>Unsupported File Type</Title>
          <FilePreview
            src="https://example.com/file.exe"
            height={200}
            showDownload
          />
        </div>

        {/* Empty State */}
        <div>
          <Title level={4}>Empty State (No File)</Title>
          <FilePreview height={200} />
        </div>
      </Space>
    </div>
  );
};

export default FilePreviewDemo;
