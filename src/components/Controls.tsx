import { useEffect, useId, useRef, type ReactNode } from 'react';
import { DECISION_STAGE_LABELS, type DecisionStage } from '../types/decision';
import { SEVERITY_MAX, SEVERITY_MIN } from '../types/feedback';

/** 通用按钮。样式集中在此，避免各视图各写一套 class。 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-ink-inverse)] hover:bg-[var(--color-accent-strong)] font-semibold',
  secondary:
    'border border-[var(--color-line-strong)] text-[var(--color-ink-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink-strong)]',
  ghost: 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-strong)]',
  danger:
    'border border-[var(--color-critical)] text-[var(--color-critical)] hover:bg-[var(--color-critical-soft)]',
};

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly variant?: ButtonVariant;
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled = false,
  ariaLabel,
  fullWidth = false,
}: ButtonProps): ReactNode {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`rounded-[var(--radius-pill)] px-3.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}

/** 选购阶段药丸，颜色与文字双重编码 */
const STAGE_CLASSES: Readonly<Record<DecisionStage, string>> = {
  shortlisted: 'border-[var(--color-accent)] text-[var(--color-accent)]',
  considering: 'border-[var(--color-info)] text-[var(--color-info)]',
  purchased: 'border-[var(--color-positive)] text-[var(--color-positive)]',
  'ruled-out': 'border-[var(--color-line-strong)] text-[var(--color-ink-muted)]',
};

export function StagePill({ stage }: { readonly stage: DecisionStage }): ReactNode {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] leading-none font-medium ${STAGE_CLASSES[stage]}`}
    >
      {DECISION_STAGE_LABELS[stage]}
    </span>
  );
}

export interface FieldProps {
  readonly label: string;
  readonly children: (id: string) => ReactNode;
  readonly hint?: string;
  readonly required?: boolean;
}

/** 表单字段容器：保证每个控件都有关联的 label 与可选说明 */
export function Field({ label, children, hint, required = false }: FieldProps): ReactNode {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[var(--color-ink-muted)]">
        {label}
        {required && (
          <span className="ml-1 text-[var(--color-critical)]" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">（必填）</span>}
      </label>
      <div className="mt-1" aria-describedby={hint === undefined ? undefined : hintId}>
        {children(id)}
      </div>
      {hint !== undefined && (
        <p id={hintId} className="mt-1 text-xs text-[var(--color-ink-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

export const INPUT_CLASSES =
  'w-full rounded-[var(--radius-control)] border border-[var(--color-line-subtle)] bg-[var(--color-surface-inset)] px-2.5 py-1.5 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)]';

export interface ScoreInputProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
}

/** 1-5 分评分。用 radio group 而非滑块，键盘操作更明确。 */
export function ScoreInput({ label, value, onChange }: ScoreInputProps): ReactNode {
  const groupId = useId();
  const options = Array.from(
    { length: SEVERITY_MAX - SEVERITY_MIN + 1 },
    (_, index) => SEVERITY_MIN + index,
  );
  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-medium text-[var(--color-ink-muted)]">{label}</legend>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <label
            key={option}
            className={`flex size-7 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border text-xs transition-colors ${
              value === option
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-ink-strong)] font-semibold'
                : 'border-[var(--color-line-subtle)] text-[var(--color-ink-muted)] hover:border-[var(--color-line-strong)]'
            }`}
          >
            <input
              type="radio"
              name={groupId}
              value={option}
              checked={value === option}
              onChange={() => {
                onChange(option);
              }}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface ModalProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

/** 弹窗：Esc 关闭、焦点进入内部、关闭后焦点回到触发元素 */
export function Modal({ title, onClose, children, footer }: ModalProps): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const previousFocusRef = useRef<Element | null>(null);

  // onClose 每次渲染都是新函数，放进依赖会让下面的聚焦 effect 反复执行，
  // 从而在用户打字时把焦点抢回面板。用 ref 持有最新回调，effect 只在挂载时跑一次。
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const previous = previousFocusRef.current;
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/65 p-4 sm:items-center">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="panel w-full max-w-2xl p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--color-ink-strong)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭对话框"
            className="rounded px-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink-strong)]"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer !== undefined && (
          <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
