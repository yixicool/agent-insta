import { describe, expect, it, vi } from 'vitest';
import { MAX_UPLOAD_IMAGE_BYTES, readImageAsDataUrl } from './image-upload';

/**
 * FileReader 在 jsdom 里可用，因此直接构造真实的 File 对象即可，
 * 不需要 mock 底层实现——除了触发 onerror 的路径。
 */

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe('readImageAsDataUrl', () => {
  it('accepts a small jpeg and returns its data URL', async () => {
    const file = makeFile('scene.jpg', 'image/jpeg', 1024);
    const result = await readImageAsDataUrl(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.startsWith('data:image/jpeg')).toBe(true);
    }
  });

  it('rejects an unsupported file type', async () => {
    const file = makeFile('scene.gif', 'image/gif', 1024);
    const result = await readImageAsDataUrl(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('file-rejected');
    }
  });

  it('rejects a file larger than the size limit', async () => {
    const file = makeFile('scene.jpg', 'image/jpeg', MAX_UPLOAD_IMAGE_BYTES + 1);
    const result = await readImageAsDataUrl(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('file-rejected');
    }
  });

  it('reports decode-failed when FileReader errors out', async () => {
    const OriginalFileReader = globalThis.FileReader;
    class FailingFileReader {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      error = new Error('boom');
      readAsDataURL(): void {
        queueMicrotask(() => {
          this.onerror?.();
        });
      }
    }
    vi.stubGlobal('FileReader', FailingFileReader);

    const file = makeFile('scene.jpg', 'image/jpeg', 1024);
    const result = await readImageAsDataUrl(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('decode-failed');
    }

    vi.stubGlobal('FileReader', OriginalFileReader);
  });
});
