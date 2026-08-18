import { describeUnknownError, fail, ok, type Result } from '../types/result';

/**
 * 用户上传玩法配图的校验与解码。
 *
 * 配图是可选项，一旦选了就要控制大小：base64 编码后体积会比原文件大约三分之一，
 * 1.5MB 原图换算下来约 2MB 字符串，仍在 localStorage 单键写入的安全范围内。
 */

export const MAX_UPLOAD_IMAGE_BYTES = 1.5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

export function readImageAsDataUrl(file: File): Promise<Result<string>> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return Promise.resolve(
      fail(
        'file-rejected',
        `不支持这种图片格式（${file.type || '未知类型'}）。`,
        '请上传 JPEG、PNG 或 WebP 格式的图片。',
      ),
    );
  }

  if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
    return Promise.resolve(
      fail(
        'file-rejected',
        `图片太大（${(file.size / 1024 / 1024).toFixed(1)}MB）。`,
        `请上传 ${(MAX_UPLOAD_IMAGE_BYTES / 1024 / 1024).toFixed(1)}MB 以内的图片，或压缩后再试。`,
      ),
    );
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        resolve(fail('decode-failed', '图片解码失败。', '可以换一张图片重试，或不配图直接提交。'));
        return;
      }
      resolve(ok(result));
    };
    reader.onerror = () => {
      resolve(
        fail(
          'decode-failed',
          `图片读取失败：${describeUnknownError(reader.error)}`,
          '可以换一张图片重试，或不配图直接提交。',
        ),
      );
    };
    reader.readAsDataURL(file);
  });
}
