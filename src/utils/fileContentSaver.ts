import type { FileContentSaveOptions } from '@/types/interfaces/fileTree';

type Args = [fileId: string, content: string, originalContent: string];
type Request = { args: Args; resolve: (saved: boolean) => void };
type Entry = {
  generation: number;
  pending?: Request;
  running?: Request;
  timer?: ReturnType<typeof setTimeout>;
  ready: boolean;
};

/** 按文件合并输入、串行写入；只有本次内容实际落盘才回 true。 */
export function createFileContentSaver(
  write: (...args: Args) => Promise<boolean>,
  delay = 500,
) {
  const entries = new Map<string, Entry>();
  let generation = 0;

  const drain = async (id: string, entry: Entry): Promise<void> => {
    if (
      entry.running ||
      !entry.pending ||
      !entry.ready ||
      entry.generation !== generation
    )
      return;
    const request = entry.pending;
    entry.pending = undefined;
    entry.running = request;
    entry.ready = false;
    try {
      const saved = await write(...request.args);
      request.resolve(entry.generation === generation && saved === true);
    } catch {
      request.resolve(false);
    } finally {
      entry.running = undefined;
      if (entry.generation !== generation) return;
      const latest = entries.get(id);
      if (latest !== entry) return;
      if (latest.pending && latest.ready) void drain(id, latest);
      else if (!latest.pending) entries.delete(id);
    }
  };

  const save = (
    id: string,
    content: string,
    original: string,
    options?: FileContentSaveOptions,
  ): Promise<boolean> => {
    let entry = entries.get(id);
    if (!entry) {
      entry = { generation, ready: false };
      entries.set(id, entry);
    }
    const current = entry;
    return new Promise((resolve) => {
      // 被更新内容替代的请求没有落盘，不能向编辑器回报已保存。
      current.pending?.resolve(false);
      current.pending = { args: [id, content, original], resolve };
      if (current.timer !== undefined) clearTimeout(current.timer);
      current.timer = undefined;
      current.ready = options?.immediate === true;
      if (current.ready) void drain(id, current);
      else
        current.timer = setTimeout(() => {
          current.timer = undefined;
          current.ready = true;
          void drain(id, current);
        }, delay);
    });
  };

  return Object.assign(save, {
    cancel() {
      generation += 1;
      for (const entry of entries.values()) {
        if (entry.timer !== undefined) clearTimeout(entry.timer);
        entry.pending?.resolve(false);
        entry.running?.resolve(false);
      }
      entries.clear();
    },
  });
}
