import { isHttpUrl, isIsoDate } from '../lib/guards';
import {
  AUTHORITATIVE_SOURCE_KINDS,
  SOURCE_KIND_LABELS,
  type SourceKind,
  type SourceRef,
  type Sourced,
} from '../types/provenance';

/**
 * 数据溯源校验。配套测试会遍历全部数据文件，
 * 作为「无来源字段不得进入产品」的自动化闸门。
 */

export interface IntegrityIssue {
  /** 出问题的字段路径，例如 'dji-osmo-action-6.price' */
  readonly path: string;
  readonly problem: string;
}

export interface SourceCheckOptions {
  /** 是否要求至少一条官方或官方新闻稿来源 */
  readonly requireAuthoritative: boolean;
  /** 采集日期不得晚于该日期，ISO yyyy-mm-dd */
  readonly today: string;
  /** 只允许这些来源类型；留空表示不限制 */
  readonly allowedKinds?: readonly SourceKind[];
}

function checkSourceRef(
  source: SourceRef,
  path: string,
  options: SourceCheckOptions,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  if (source.publisher.trim() === '') {
    issues.push({ path, problem: '来源缺少发布方。' });
  }
  if (source.title.trim() === '') {
    issues.push({ path, problem: '来源缺少标题。' });
  }
  if (!isHttpUrl(source.url)) {
    issues.push({ path, problem: `来源 URL 不是合法的 http(s) 地址：${source.url}` });
  }
  if (!isIsoDate(source.retrievedAt)) {
    issues.push({ path, problem: `采集日期格式非法：${source.retrievedAt}` });
  } else if (source.retrievedAt > options.today) {
    issues.push({
      path,
      problem: `采集日期晚于今天（${source.retrievedAt} > ${options.today}）。`,
    });
  }
  const allowed = options.allowedKinds;
  if (allowed !== undefined && !allowed.includes(source.kind)) {
    const labels = allowed.map((kind) => SOURCE_KIND_LABELS[kind]).join(' / ');
    issues.push({
      path,
      problem: `来源类型「${SOURCE_KIND_LABELS[source.kind]}」不被允许，应为：${labels}`,
    });
  }
  return issues;
}

/** 校验单个 Sourced 字段 */
export function checkSourcedField(
  field: Sourced<unknown>,
  path: string,
  options: SourceCheckOptions,
): readonly IntegrityIssue[] {
  if (field.sources.length === 0) {
    return [{ path, problem: '字段没有任何来源。' }];
  }

  const issues = field.sources.flatMap((source, index) =>
    checkSourceRef(source, `${path}.sources[${index}]`, options),
  );

  if (options.requireAuthoritative) {
    const hasAuthoritative = field.sources.some((source) =>
      AUTHORITATIVE_SOURCE_KINDS.includes(source.kind),
    );
    if (!hasAuthoritative) {
      issues.push({ path, problem: '规格或价格字段缺少官方 / 官方新闻稿来源。' });
    }
  }

  return issues;
}

/** 批量校验，入参是 路径 → 字段 的映射 */
export function checkSourcedFields(
  entries: readonly (readonly [string, Sourced<unknown>])[],
  options: SourceCheckOptions,
): readonly IntegrityIssue[] {
  return entries.flatMap(([path, field]) => checkSourcedField(field, path, options));
}

/** 把问题列表渲染成可读报告，供测试失败信息与开发调试使用 */
export function formatIssues(issues: readonly IntegrityIssue[]): string {
  if (issues.length === 0) {
    return '全部字段来源合规。';
  }
  return issues.map((issue) => `- ${issue.path}: ${issue.problem}`).join('\n');
}
