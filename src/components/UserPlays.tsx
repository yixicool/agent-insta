import { useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { MAX_UPLOAD_IMAGE_BYTES, readImageAsDataUrl } from '../lib/image-upload';
import { Button, Field, INPUT_CLASSES, Modal } from './Controls';
import { LocalDataBadge } from './SourceBadge';
import type { AppError } from '../types/result';
import type { UserPlay, UserPlayInput } from '../types/user-play';

/**
 * 用户自己上传的玩法：卡片展示 + 上传入口卡与表单弹窗。
 *
 * 与官方玩法卡（HomeView 的 PlayCard）刻意分开：没有契合度、没有 evidence，
 * 一律带「本地数据」徽标，避免被误认成编者整理的真实证据。
 */

const CARD_IMAGE_CLASSES = 'block h-32 w-full rounded-t-[var(--radius-panel)] object-cover';

/** 没有配图时的占位块，保证卡片高度与有图的一致 */
function PlaceholderThumb(): ReactNode {
  return (
    <div
      className={`${CARD_IMAGE_CLASSES} flex items-center justify-center bg-[var(--color-surface-inset)]`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-8 text-[var(--color-ink-muted)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M3 16l4.5-4 4 3.5L17 11l4 4" />
      </svg>
      <span className="sr-only">未配图</span>
    </div>
  );
}

export interface UserPlayCardProps {
  readonly play: UserPlay;
  readonly onRemove: () => void;
}

export function UserPlayCard({ play, onRemove }: UserPlayCardProps): ReactNode {
  return (
    <article className="panel overflow-hidden">
      {play.imageDataUrl === null ? (
        <PlaceholderThumb />
      ) : (
        <img src={play.imageDataUrl} alt={`${play.name} 配图`} className={CARD_IMAGE_CLASSES} />
      )}

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-accent)]">{play.sceneLabel}</p>
            <h4 className="mt-0.5 text-base font-semibold text-[var(--color-ink-strong)]">
              {play.name}
            </h4>
          </div>
          <LocalDataBadge />
        </div>

        <p className="mt-2 text-sm text-[var(--color-ink-body)]">{play.summary}</p>

        <div className="mt-3 flex justify-end border-t border-[var(--color-line-subtle)] pt-3">
          <Button variant="danger" onClick={onRemove} ariaLabel={`删除「${play.name}」`}>
            删除
          </Button>
        </div>
      </div>
    </article>
  );
}

interface UploadDraft {
  readonly sceneLabel: string;
  readonly name: string;
  readonly summary: string;
  readonly imageDataUrl: string | null;
}

const EMPTY_DRAFT: UploadDraft = {
  sceneLabel: '',
  name: '',
  summary: '',
  imageDataUrl: null,
};

export interface UploadPlayCardProps {
  readonly onSubmit: (input: UserPlayInput) => void;
}

/** 首页网格末尾的上传入口：虚线卡片 + 点开后的表单弹窗 */
export function UploadPlayCard({ onSubmit }: UploadPlayCardProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<UploadDraft>(EMPTY_DRAFT);
  const [imageError, setImageError] = useState<AppError | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputId = useId();
  const uploadHintId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function closeAndReset(): void {
    setIsOpen(false);
    setDraft(EMPTY_DRAFT);
    setImageError(null);
    setFormError(null);
    setIsDecoding(false);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }
    setImageError(null);
    setIsDecoding(true);
    const result = await readImageAsDataUrl(file);
    setIsDecoding(false);
    if (!result.ok) {
      setImageError(result.error);
      if (fileInputRef.current !== null) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setDraft((current) => ({ ...current, imageDataUrl: result.data }));
  }

  function handleSubmit(): void {
    if (draft.sceneLabel.trim() === '' || draft.name.trim() === '' || draft.summary.trim() === '') {
      setFormError('场景名称、玩法名称与怎么拍都要填才能上传。');
      return;
    }
    onSubmit({
      sceneLabel: draft.sceneLabel,
      name: draft.name,
      summary: draft.summary,
      imageDataUrl: draft.imageDataUrl,
    });
    closeAndReset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
        }}
        aria-label="上传我的玩法"
        aria-describedby={uploadHintId}
        className="panel panel-interactive flex min-h-48 w-full flex-col items-center justify-center gap-2 border-dashed p-5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink-strong)]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        <span aria-hidden="true" className="text-sm font-medium">
          上传我的玩法
        </span>
        <span id={uploadHintId} className="text-xs">
          分享你自己的拍摄场景与拍法
        </span>
      </button>

      {isOpen && (
        <Modal
          title="上传我的玩法"
          onClose={closeAndReset}
          footer={
            <>
              <Button variant="ghost" onClick={closeAndReset}>
                取消
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={isDecoding}>
                提交
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--color-ink-muted)]">
              这是你自己的分享，仅保存在这台浏览器里，不代表官方证据或产品能力评测。
            </p>

            <Field label="场景名称" hint="例如「城市夜骑」。" required>
              {(id) => (
                <input
                  id={id}
                  type="text"
                  value={draft.sceneLabel}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, sceneLabel: event.target.value }));
                  }}
                  className={INPUT_CLASSES}
                />
              )}
            </Field>

            <Field label="玩法名称" required>
              {(id) => (
                <input
                  id={id}
                  type="text"
                  value={draft.name}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, name: event.target.value }));
                  }}
                  className={INPUT_CLASSES}
                />
              )}
            </Field>

            <Field label="怎么拍" required>
              {(id) => (
                <textarea
                  id={id}
                  rows={3}
                  value={draft.summary}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, summary: event.target.value }));
                  }}
                  className={INPUT_CLASSES}
                />
              )}
            </Field>

            <Field
              label="配图（可选）"
              hint={`JPEG/PNG/WebP，${(MAX_UPLOAD_IMAGE_BYTES / 1024 / 1024).toFixed(1)}MB 以内。`}
            >
              {() => (
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    void handleFileChange(event);
                  }}
                  className="block w-full text-sm text-[var(--color-ink-body)]"
                />
              )}
            </Field>

            {isDecoding && (
              <p className="text-xs text-[var(--color-ink-muted)]" role="status">
                正在处理图片…
              </p>
            )}

            {imageError !== null && (
              <p className="text-xs text-[var(--color-critical)]" role="alert">
                {imageError.message}
                {imageError.hint}
              </p>
            )}

            {draft.imageDataUrl !== null && (
              <img
                src={draft.imageDataUrl}
                alt="配图预览"
                className="h-28 w-full rounded-[var(--radius-control)] object-cover"
              />
            )}

            {formError !== null && (
              <p className="text-xs text-[var(--color-critical)]" role="alert">
                {formError}
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
