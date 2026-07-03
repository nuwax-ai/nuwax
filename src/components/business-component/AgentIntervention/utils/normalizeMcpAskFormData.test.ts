import { UploadFileStatus } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { describe, expect, it } from 'vitest';
import type { InteractionUiSchema } from '../types/mcpAskIntervention';
import {
  extractUploadedFileUrls,
  hydrateMcpAskFileFieldValue,
  hydrateMcpAskFormValues,
  limitMcpAskUploadFileList,
  normalizeMcpAskFileFieldValue,
  normalizeMcpAskFormData,
  urlToUploadFileInfo,
  validateMcpAskRequiredFileField,
} from './normalizeMcpAskFormData';

const fileUi = (
  fields: InteractionUiSchema['fields'],
): InteractionUiSchema => ({
  version: 'nuwax.interaction.v2',
  presentation: 'inline',
  title: '上传',
  fields,
});

describe('normalizeMcpAskFormData', () => {
  it('extracts remote URLs from UploadFileInfo list', () => {
    const files: UploadFileInfo[] = [
      {
        uid: '1',
        name: 'a.png',
        type: 'image/png',
        size: 100,
        status: UploadFileStatus.done,
        url: 'https://cdn.example.com/a.png',
      },
      {
        uid: '2',
        name: 'b.png',
        type: 'image/png',
        size: 200,
        status: UploadFileStatus.uploading,
        url: '',
      },
    ];

    expect(extractUploadedFileUrls(files)).toEqual([
      'https://cdn.example.com/a.png',
    ]);
  });

  it('keeps existing URL strings unchanged', () => {
    expect(
      extractUploadedFileUrls('https://cdn.example.com/existing.png'),
    ).toEqual(['https://cdn.example.com/existing.png']);
    expect(
      extractUploadedFileUrls([
        'https://cdn.example.com/1.png',
        'https://cdn.example.com/2.png',
      ]),
    ).toEqual([
      'https://cdn.example.com/1.png',
      'https://cdn.example.com/2.png',
    ]);
  });

  it('normalizes single file field to one URL string', () => {
    expect(
      normalizeMcpAskFileFieldValue(
        [
          {
            uid: '1',
            name: 'shot.png',
            type: 'image/png',
            size: 10,
            status: UploadFileStatus.done,
            url: 'https://cdn.example.com/shot.png',
          },
        ],
        false,
      ),
    ).toBe('https://cdn.example.com/shot.png');
  });

  it('normalizes multiple file field to URL array', () => {
    expect(
      normalizeMcpAskFileFieldValue(
        [
          {
            uid: '1',
            name: 'a.png',
            type: 'image/png',
            size: 10,
            status: UploadFileStatus.done,
            url: 'https://cdn.example.com/a.png',
          },
          {
            uid: '2',
            name: 'b.png',
            type: 'image/png',
            size: 20,
            status: UploadFileStatus.done,
            url: 'https://cdn.example.com/b.png',
          },
        ],
        true,
      ),
    ).toEqual([
      'https://cdn.example.com/a.png',
      'https://cdn.example.com/b.png',
    ]);
  });

  it('rejects required file field without remote URL', () => {
    expect(() =>
      validateMcpAskRequiredFileField([
        {
          uid: '1',
          name: 'shot.png',
          type: 'image/png',
          size: 10,
          status: UploadFileStatus.uploading,
          url: '',
        },
      ]),
    ).toThrow('MCP_ASK_FILE_REQUIRED');
  });

  it('accepts required file field with remote URL', () => {
    expect(() =>
      validateMcpAskRequiredFileField([
        {
          uid: '1',
          name: 'shot.png',
          type: 'image/png',
          size: 10,
          status: UploadFileStatus.done,
          url: 'https://cdn.example.com/shot.png',
        },
      ]),
    ).not.toThrow();
  });

  it('normalizes only file widgets in form data', () => {
    const formData = normalizeMcpAskFormData(
      {
        choice: 'deploy',
        screenshot: [
          {
            uid: '1',
            name: 'shot.png',
            type: 'image/png',
            size: 10,
            status: UploadFileStatus.done,
            url: 'https://cdn.example.com/shot.png',
          },
        ],
        attachments: [
          {
            uid: '2',
            name: 'doc.pdf',
            type: 'application/pdf',
            size: 20,
            status: UploadFileStatus.done,
            url: 'https://cdn.example.com/doc.pdf',
          },
        ],
      },
      fileUi([
        { name: 'choice', title: '选项', widget: 'radio' },
        { name: 'screenshot', title: '截图', widget: 'file' },
        {
          name: 'attachments',
          title: '附件',
          widget: 'file',
          multiple: true,
        },
      ]),
    );

    expect(formData).toEqual({
      choice: 'deploy',
      screenshot: 'https://cdn.example.com/shot.png',
      attachments: ['https://cdn.example.com/doc.pdf'],
    });
  });

  it('hydrates submitted URL strings back to Upload fileList', () => {
    const hydrated = hydrateMcpAskFormValues(
      {
        screenshot: 'https://cdn.example.com/shot.png',
        attachments: ['https://cdn.example.com/a.pdf'],
      },
      fileUi([
        { name: 'screenshot', title: '截图', widget: 'file' },
        {
          name: 'attachments',
          title: '附件',
          widget: 'file',
          multiple: true,
        },
      ]),
    );

    expect(hydrated.screenshot).toEqual([
      urlToUploadFileInfo('https://cdn.example.com/shot.png', 0),
    ]);
    expect(hydrated.attachments).toEqual([
      urlToUploadFileInfo('https://cdn.example.com/a.pdf', 0),
    ]);
  });

  it('keeps existing Upload fileList when hydrating in-progress values', () => {
    const uploading: UploadFileInfo[] = [
      {
        uid: 'local-1',
        name: 'local.png',
        type: 'image/png',
        size: 10,
        status: UploadFileStatus.uploading,
        url: '',
      },
    ];

    expect(hydrateMcpAskFileFieldValue(uploading, false)).toEqual(uploading);
  });

  it('limits single-file field hydration to one URL', () => {
    expect(
      hydrateMcpAskFileFieldValue(
        ['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'],
        false,
      ),
    ).toEqual([urlToUploadFileInfo('https://cdn.example.com/a.png', 0)]);
  });

  it('limits single-file upload list to the latest file', () => {
    const files: UploadFileInfo[] = [
      {
        uid: '1',
        name: 'a.png',
        type: 'image/png',
        size: 10,
        status: UploadFileStatus.done,
        url: 'https://cdn.example.com/a.png',
      },
      {
        uid: '2',
        name: 'b.png',
        type: 'image/png',
        size: 20,
        status: UploadFileStatus.done,
        url: 'https://cdn.example.com/b.png',
      },
    ];

    expect(limitMcpAskUploadFileList(files, false)).toEqual([files[1]]);
    expect(limitMcpAskUploadFileList(files, true)).toEqual(files);
  });
});
