import { describeUnknownError, fail, ok, type Result } from '../types/result';

/** 用 Blob + 临时链接触发下载，不依赖任何后端。 */
export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType: string,
): Result<void> {
  if (fileName.trim() === '') {
    return fail('invalid-input', '文件名不能为空。', '请提供有效的文件名后重试。');
  }

  let objectUrl: string | null = null;
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    return ok(undefined);
  } catch (caught: unknown) {
    return fail(
      'invalid-input',
      `导出失败：${describeUnknownError(caught)}`,
      '可以尝试更换浏览器，或手动复制页面上的报告内容。',
    );
  } finally {
    if (objectUrl !== null) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

export function downloadMarkdown(fileName: string, markdown: string): Result<void> {
  return downloadTextFile(fileName, markdown, 'text/markdown');
}

/** 生成带日期后缀的文件名，避免多次导出互相覆盖 */
export function buildDatedFileName(base: string, extension: string, isoTimestamp: string): string {
  const datePart = isoTimestamp.slice(0, 10);
  const safeBase = base.replace(/[^\w一-龥-]+/g, '-').replace(/^-+|-+$/g, '');
  const finalBase = safeBase === '' ? 'export' : safeBase;
  return `${finalBase}-${datePart}.${extension}`;
}
