import {
  Button,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';

import {
  buildDesktopShellPreviewUrl,
  DESKTOP_SHELL_VIEWPORT_PRESETS,
  type DesktopShellPreviewPlatform,
} from '@/utils/desktopShellPreview';

import styles from './index.less';

const PLATFORM_OPTIONS = [
  { label: 'macOS', value: 'macos' },
  { label: 'Windows', value: 'windows' },
  { label: 'Linux', value: 'linux' },
];

const readInitialTarget = (): string => {
  const target = new URLSearchParams(window.location.search).get('path');
  return target?.startsWith('/') ? target : '/home';
};

export default function DesktopShellPreview() {
  const [platform, setPlatform] =
    useState<DesktopShellPreviewPlatform>('windows');
  const [draftPath, setDraftPath] = useState(readInitialTarget);
  const [targetPath, setTargetPath] = useState(readInitialTarget);
  const [width, setWidth] = useState(DESKTOP_SHELL_VIEWPORT_PRESETS[0].width);
  const [height, setHeight] = useState(
    DESKTOP_SHELL_VIEWPORT_PRESETS[0].height,
  );
  const [reloadKey, setReloadKey] = useState(0);

  const frameSrc = useMemo(
    () => buildDesktopShellPreviewUrl({ targetPath, platform }),
    [platform, targetPath],
  );

  const applyPath = () => {
    setTargetPath(draftPath || '/home');
    setReloadKey((value) => value + 1);
  };

  const applyPreset = (value: string) => {
    const preset = DESKTOP_SHELL_VIEWPORT_PRESETS.find(
      (item) => `${item.width}x${item.height}` === value,
    );
    if (!preset) return;
    setWidth(preset.width);
    setHeight(preset.height);
  };

  return (
    <main className={styles.page}>
      <section className={styles.toolbar} aria-label="桌面壳预览控制台">
        <div className={styles.heading}>
          <Typography.Title level={4}>桌面壳浏览器预览</Typography.Title>
          <Typography.Text type="secondary">
            复用真实宿主判断与避让规则；iframe 视口会触发真实媒体查询。
          </Typography.Text>
        </div>

        <Space wrap size={12} className={styles.controls}>
          <Segmented
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(value) =>
              setPlatform(value as DesktopShellPreviewPlatform)
            }
          />
          <Select
            aria-label="视口预设"
            defaultValue="1200x720"
            options={DESKTOP_SHELL_VIEWPORT_PRESETS.map((preset) => ({
              label: `${preset.label} · ${preset.width}×${preset.height}`,
              value: `${preset.width}x${preset.height}`,
            }))}
            onChange={applyPreset}
            className={styles.preset}
          />
          <InputNumber
            aria-label="预览宽度"
            min={800}
            max={2560}
            addonAfter="宽"
            value={width}
            onChange={(value) => value && setWidth(value)}
          />
          <InputNumber
            aria-label="预览高度"
            min={600}
            max={1600}
            addonAfter="高"
            value={height}
            onChange={(value) => value && setHeight(value)}
          />
          <Tag color={width === 1200 && height === 720 ? 'green' : 'default'}>
            最小支持 1200×720
          </Tag>
        </Space>

        <Space.Compact block>
          <Input
            aria-label="目标业务路径"
            value={draftPath}
            placeholder="/space/752/mcp"
            onChange={(event) => setDraftPath(event.target.value)}
            onPressEnter={applyPath}
          />
          <Button type="primary" onClick={applyPath}>
            打开路径
          </Button>
          <Button onClick={() => setReloadKey((value) => value + 1)}>
            刷新预览
          </Button>
        </Space.Compact>
      </section>

      <section className={styles.stage} aria-label="桌面壳预览画布">
        <div className={styles.metrics}>
          {platform} · {width}×{height} · {targetPath}
        </div>
        <div className={styles.viewport} style={{ width, height }}>
          <iframe
            key={`${frameSrc}-${reloadKey}`}
            title="桌面壳业务页面预览"
            src={frameSrc}
            width={width}
            height={height}
          />
        </div>
      </section>
    </main>
  );
}
