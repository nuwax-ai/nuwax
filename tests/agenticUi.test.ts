import {
  extractAgenticUiSurfaces,
  mergeAgenticUiSurfaces,
  validateAgenticUiSurface,
} from '@/utils/agenticUi';
import { describe, expect, it } from 'vitest';

const createSurface = () => ({
  schemaVersion: 'nuwax.agentic-ui.v1',
  surfaceId: 'demo-surface',
  status: 'ready',
  mode: 'replace',
  root: {
    type: 'Page',
    props: {
      title: 'AI UI',
    },
    children: [
      {
        type: 'Card',
        props: {
          title: 'Overview',
        },
      },
    ],
  },
});

describe('Agentic UI schema utils', () => {
  it('validates a nuwax.agentic-ui.v1 surface', () => {
    const result = validateAgenticUiSurface(createSurface());

    expect(result.surface?.surfaceId).toBe('demo-surface');
    expect(result.error).toBeUndefined();
  });

  it('extracts a surface from nested MCP tool result data', () => {
    const surfaces = extractAgenticUiSurfaces({
      eventType: 'PROCESSING',
      data: {
        result: {
          data: createSurface(),
        },
      },
    });

    expect(surfaces).toHaveLength(1);
    expect(surfaces[0]?.root?.type).toBe('Page');
  });

  it('extracts a surface from a fenced JSON string', () => {
    const surfaces = extractAgenticUiSurfaces({
      data: {
        text: `已生成预览\n\n\`\`\`json\n${JSON.stringify(
          createSurface(),
        )}\n\`\`\``,
      },
    });

    expect(surfaces).toHaveLength(1);
    expect(surfaces[0].surfaceId).toBe('demo-surface');
  });

  it('ignores unsupported schema payloads', () => {
    const result = validateAgenticUiSurface({
      ...createSurface(),
      schemaVersion: 'unknown',
    });

    expect(result.surface).toBeNull();
    expect(result.error).toBe('Unsupported Agentic UI schemaVersion.');
  });

  it('appends children into an existing surface', () => {
    const [merged] =
      mergeAgenticUiSurfaces([createSurface() as any], [
        {
          schemaVersion: 'nuwax.agentic-ui.v1',
          surfaceId: 'demo-surface',
          status: 'streaming',
          mode: 'append',
          root: {
            type: 'Page',
            children: [{ type: 'Alert', props: { message: 'append' } }],
          },
        },
      ] as any) || [];

    expect(merged?.root?.children).toHaveLength(2);
    expect(merged?.status).toBe('streaming');
  });

  it('applies simple patch operations to an existing surface', () => {
    const [merged] =
      mergeAgenticUiSurfaces([createSurface() as any], [
        {
          schemaVersion: 'nuwax.agentic-ui.v1',
          surfaceId: 'demo-surface',
          status: 'ready',
          mode: 'patch',
          patches: [
            {
              op: 'add',
              path: '/root/children/-',
              value: { type: 'Alert', props: { message: 'patched' } },
            },
          ],
        },
      ] as any) || [];

    expect(merged?.root?.children).toHaveLength(2);
    expect(merged?.root?.children?.[1]?.type).toBe('Alert');
  });
});
