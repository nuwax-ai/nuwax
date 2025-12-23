import FilePreview from '@/components/business-component/FilePreview';
import { Divider, Space, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

/**
 * Demo for FilePreview component
 * Supports DOCX, XLSX, PPTX, and PDF file preview
 */
const FilePreviewDemo: React.FC = () => {
  // Test files from vue-office examples
  const testFiles = {
    docx: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.docx',
    xlsx: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.xlsx',
    pdf: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.pdf',
    pptx: 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.pptx',
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>FilePreview Component Demo</Title>
      <Text type="secondary">
        Supports DOCX, XLSX, PPTX, and PDF file preview
      </Text>

      <Divider />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* DOCX Preview */}
        <div>
          <Title level={4}>DOCX Preview</Title>
          <FilePreview
            src={testFiles.docx}
            height={400}
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
            onRendered={() => console.log('PPTX rendered')}
            onError={(e) => console.error('PPTX error:', e)}
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
