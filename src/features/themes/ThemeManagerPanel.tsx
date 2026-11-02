import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import type {
  HostThemeFiles,
  HostThemePreference,
  HostThemeResult,
} from '@/types/interfaces/hostBridge';
import { isDesktopHost } from '@/utils/hostBridge';
import {
  Alert,
  Button,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { useRef, useState, useSyncExternalStore } from 'react';
import { readThemeZip, writeThemeZip } from './archive';
import { encodeThemeText, validateThemePackage } from './core';
import { themeRuntime } from './runtime';

const text = (key: string) => dict(`PC.Themes.${key}`);

export default function ThemeManagerPanel() {
  const state = useSyncExternalStore(
    themeRuntime.subscribe,
    themeRuntime.getState,
  );
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [modal, modalContext] = Modal.useModal();
  const [notices, noticesContext] = message.useMessage();
  const { navigationStyle, updateNavigationStyle } = useUnifiedTheme();
  const selected = state.themes.find(
    (item) => item.id === state.selection.themeId,
  );
  const desktop = isDesktopHost();
  const modes = selected?.modes ?? ['light'];

  const perform = async (operation: () => Promise<HostThemeResult | void>) => {
    setPending(true);
    try {
      const result = await operation();
      if (result && !result.ok && !result.canceled)
        throw new Error(result.error || text('failed'));
    } catch (error) {
      void notices.error(
        error instanceof Error ? error.message : text('failed'),
      );
    } finally {
      setPending(false);
    }
  };

  const activateImported = async (
    files: HostThemeFiles,
    replace = false,
  ): Promise<HostThemeResult | void> => {
    const pkg = validateThemePackage(files);
    const result = await themeRuntime.install(files, replace);
    if (result.conflict && !replace) {
      modal.confirm({
        title: text('replaceTitle'),
        content: text('replaceHint'),
        okText: text('replace'),
        cancelText: text('cancel'),
        onOk: () => perform(() => activateImported(files, true)),
      });
      return;
    }
    if (!result.ok) return result;
    const mode = pkg.manifest.variants[state.snapshot.mode]
      ? state.snapshot.mode
      : (Object.keys(pkg.manifest.variants)[0] as HostThemePreference);
    return themeRuntime.select(pkg.manifest.id, mode);
  };

  const download = async (id: string, template = false) => {
    const result = await themeRuntime.exportPackage(id);
    if (!result.files) throw new Error(result.error || text('failed'));
    const files = { ...result.files };
    if (template) {
      const manifest = validateThemePackage(files).manifest;
      files['theme.json'] = encodeThemeText(
        JSON.stringify(
          { ...manifest, id: 'my-theme', name: 'My Theme' },
          null,
          2,
        ),
      );
    }
    const blob = await writeThemeZip(files);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${template ? 'my-theme' : id}.zip`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="theme-manager" data-theme-part="theme-settings">
      {modalContext}
      {noticesContext}
      <Typography.Title level={5} style={{ margin: 0 }}>
        {text('title')}
      </Typography.Title>
      <Typography.Text type="secondary">
        {text(desktop ? 'desktopHint' : 'webHint')}
      </Typography.Text>
      {state.recovery && (
        <Alert type="info" showIcon message={text('recovery')} />
      )}
      {state.error && (
        <Alert
          type="warning"
          showIcon
          message={text('retained')}
          description={state.error}
        />
      )}
      <input
        ref={input}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file)
            void perform(async () =>
              activateImported(await readThemeZip(file)),
            );
        }}
      />
      <div className="theme-manager-actions">
        <Button disabled={pending} onClick={() => input.current?.click()}>
          {text('import')}
        </Button>
        {desktop && (
          <Button
            disabled={pending}
            onClick={() => void perform(() => themeRuntime.linkDirectory())}
          >
            {text('link')}
          </Button>
        )}
        <Button
          disabled={pending}
          onClick={() => void perform(() => download('nuwax-default', true))}
        >
          {text('template')}
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            void perform(() => themeRuntime.select('nuwax-default', 'light'))
          }
        >
          {text('reset')}
        </Button>
      </div>
      <div className="theme-manager-list" aria-label={text('title')}>
        {state.themes.map((item) => (
          <div
            key={item.id}
            className="theme-manager-item"
            data-selected={item.id === state.selection.themeId}
          >
            <div>
              <div className="theme-manager-name">
                {item.name}{' '}
                {item.id === state.selection.themeId && (
                  <Tag color="blue">{text('active')}</Tag>
                )}
              </div>
              <div className="theme-manager-detail">
                {item.version} · {text(item.source)} ·{' '}
                {item.modes.map((mode) => text(mode)).join(' / ')}
              </div>
              {item.description && (
                <Typography.Text type="secondary">
                  {item.description}
                </Typography.Text>
              )}
            </div>
            <Space wrap size="small">
              <Button
                disabled={pending || item.id === state.selection.themeId}
                onClick={() =>
                  void perform(() =>
                    themeRuntime.select(
                      item.id,
                      item.modes.includes(state.snapshot.mode)
                        ? state.snapshot.mode
                        : item.modes[0],
                    ),
                  )
                }
              >
                {text('apply')}
              </Button>
              <Button
                disabled={pending}
                onClick={() => void perform(() => download(item.id))}
              >
                {text('export')}
              </Button>
              {desktop && item.source !== 'builtin' && (
                <Button
                  disabled={pending}
                  onClick={() =>
                    void perform(() => themeRuntime.openDirectory(item.id))
                  }
                >
                  {text('open')}
                </Button>
              )}
              {item.source !== 'builtin' && (
                <Button
                  danger
                  disabled={pending}
                  onClick={() => {
                    modal.confirm({
                      title: text('removeTitle'),
                      content: text('removeHint'),
                      okText: text('remove'),
                      cancelText: text('cancel'),
                      onOk: () => perform(() => themeRuntime.remove(item.id)),
                    });
                  }}
                >
                  {text('remove')}
                </Button>
              )}
            </Space>
          </div>
        ))}
      </div>
      <label>
        <Space>
          {text('mode')}
          <Select
            aria-label={text('mode')}
            disabled={pending}
            value={state.selection.mode}
            style={{ minWidth: 140 }}
            options={[...modes, ...(modes.length === 2 ? ['system'] : [])].map(
              (mode) => ({ value: mode, label: text(mode) }),
            )}
            onChange={(mode) =>
              void perform(() =>
                themeRuntime.select(
                  state.selection.themeId,
                  mode as HostThemePreference,
                ),
              )
            }
          />
        </Space>
      </label>
      {!desktop && (
        <label>
          <Space>
            {text('navigation')}
            <Select
              aria-label={text('navigation')}
              value={navigationStyle}
              style={{ minWidth: 140 }}
              options={['style1', 'style2', 'style3'].map((value) => ({
                value,
                label: text(value),
              }))}
              onChange={(value) =>
                void perform(() =>
                  updateNavigationStyle(value as ThemeNavigationStyleType),
                )
              }
            />
          </Space>
        </label>
      )}
    </div>
  );
}
