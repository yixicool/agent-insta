import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDatedFileName, downloadMarkdown, downloadTextFile } from './download';

const createObjectURL = vi.fn(() => 'blob:mock-url');
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL,
    revokeObjectURL,
  });
  // jsdom 未实现导航，真实 click 会打印 "Not implemented" 噪声，这里默认拦截。
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.restoreAllMocks();
});

describe('downloadTextFile', () => {
  it('creates and revokes the object URL and removes the anchor', () => {
    const result = downloadTextFile('report.md', '# 标题', 'text/markdown');
    expect(result.ok).toBe(true);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(document.querySelector('a')).toBeNull();
  });

  it('rejects a blank file name', () => {
    const result = downloadTextFile('   ', 'content', 'text/plain');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalid-input');
    }
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('revokes the URL even when the click fails', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('blocked by browser');
    });
    const result = downloadTextFile('report.md', 'x', 'text/markdown');
    expect(result.ok).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('downloadMarkdown', () => {
  it('delegates to the text download path', () => {
    expect(downloadMarkdown('report.md', '# 验收报告').ok).toBe(true);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });
});

describe('buildDatedFileName', () => {
  it('appends the date part from an ISO timestamp', () => {
    expect(buildDatedFileName('acceptance', 'md', '2026-08-05T09:12:00.000Z')).toBe(
      'acceptance-2026-08-05.md',
    );
  });

  it('keeps Chinese characters and replaces unsafe ones', () => {
    expect(buildDatedFileName('验收报告 / v2', 'md', '2026-08-05T00:00:00.000Z')).toBe(
      '验收报告-v2-2026-08-05.md',
    );
  });

  it('falls back to a default base when everything is stripped', () => {
    expect(buildDatedFileName('***', 'json', '2026-08-05T00:00:00.000Z')).toBe(
      'export-2026-08-05.json',
    );
  });
});
