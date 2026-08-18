import { describe, expect, it } from 'vitest';
import {
  checkSourcedField,
  checkSourcedFields,
  formatIssues,
  type SourceCheckOptions,
} from './source-integrity';
import type { SourceRef } from '../types/provenance';
import { sourced } from '../types/provenance';

const TODAY = '2026-08-05';

const OPTIONS: SourceCheckOptions = { requireAuthoritative: true, today: TODAY };
const LENIENT: SourceCheckOptions = { requireAuthoritative: false, today: TODAY };

const OFFICIAL: SourceRef = {
  kind: 'official',
  publisher: 'DJI 官方',
  title: 'Osmo Action 6 规格',
  url: 'https://www.dji.com/osmo-action-6/specs',
  retrievedAt: '2026-08-04',
};

const REVIEW: SourceRef = {
  kind: 'review',
  publisher: "Tom's Guide",
  title: 'DJI Osmo Action 6 review',
  url: 'https://www.tomsguide.com/dji-osmo-action-6-review',
  retrievedAt: '2026-08-04',
};

describe('checkSourcedField - passing cases', () => {
  it('accepts a field backed by an official source', () => {
    expect(
      checkSourcedField(sourced('1/1.1 英寸', [OFFICIAL]), 'model.sensor', OPTIONS),
    ).toHaveLength(0);
  });

  it('accepts a review-only field when authority is not required', () => {
    expect(
      checkSourcedField(sourced('实测 2 小时', [REVIEW]), 'model.battery', LENIENT),
    ).toHaveLength(0);
  });

  it('accepts a source retrieved exactly today', () => {
    const field = sourced('x', [{ ...OFFICIAL, retrievedAt: TODAY }]);
    expect(checkSourcedField(field, 'model.sensor', OPTIONS)).toHaveLength(0);
  });
});

describe('checkSourcedField - missing sources', () => {
  it('rejects a field with no sources at all', () => {
    const issues = checkSourcedField(sourced('猜的参数', []), 'model.sensor', OPTIONS);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.problem).toContain('没有任何来源');
  });

  it('rejects a spec field backed only by a review', () => {
    const issues = checkSourcedField(sourced('1/1.3 英寸', [REVIEW]), 'model.sensor', OPTIONS);
    expect(issues.some((issue) => issue.problem.includes('缺少官方'))).toBe(true);
  });

  it('accepts a press release as authoritative', () => {
    const press: SourceRef = {
      kind: 'press-release',
      publisher: 'GoPro 官方新闻稿',
      title: 'MISSION 1 pricing',
      url: 'https://investor.gopro.com/press-releases/mission-1',
      retrievedAt: '2026-08-01',
    };
    expect(checkSourcedField(sourced('US$699.99', [press]), 'model.price', OPTIONS)).toHaveLength(
      0,
    );
  });
});

describe('checkSourcedField - malformed source metadata', () => {
  it('rejects a non-http url', () => {
    const issues = checkSourcedField(
      sourced('x', [{ ...OFFICIAL, url: 'javascript:alert(1)' }]),
      'model.sensor',
      OPTIONS,
    );
    expect(issues.some((issue) => issue.problem.includes('URL'))).toBe(true);
  });

  it('rejects a blank publisher or title', () => {
    const issues = checkSourcedField(
      sourced('x', [{ ...OFFICIAL, publisher: '  ', title: '' }]),
      'model.sensor',
      OPTIONS,
    );
    expect(issues.some((issue) => issue.problem.includes('发布方'))).toBe(true);
    expect(issues.some((issue) => issue.problem.includes('标题'))).toBe(true);
  });

  it('rejects a malformed retrieval date', () => {
    const issues = checkSourcedField(
      sourced('x', [{ ...OFFICIAL, retrievedAt: '2026/08/04' }]),
      'model.sensor',
      OPTIONS,
    );
    expect(issues.some((issue) => issue.problem.includes('采集日期格式'))).toBe(true);
  });

  it('rejects a future retrieval date so fabricated data cannot slip through', () => {
    const issues = checkSourcedField(
      sourced('x', [{ ...OFFICIAL, retrievedAt: '2027-01-01' }]),
      'model.sensor',
      OPTIONS,
    );
    expect(issues.some((issue) => issue.problem.includes('晚于今天'))).toBe(true);
  });

  it('reports the offending source index in the path', () => {
    const issues = checkSourcedField(
      sourced('x', [OFFICIAL, { ...REVIEW, url: 'not-a-url' }]),
      'model.sensor',
      LENIENT,
    );
    expect(issues[0]?.path).toBe('model.sensor.sources[1]');
  });
});

describe('checkSourcedField - allowed kinds', () => {
  it('rejects a community source where only reviews are allowed', () => {
    const community: SourceRef = {
      kind: 'community',
      publisher: 'Reddit r/gopro',
      title: 'battery drain thread',
      url: 'https://www.reddit.com/r/gopro/comments/example',
      retrievedAt: '2026-08-02',
    };
    const issues = checkSourcedField(
      sourced('实测 90 分钟', [community]),
      'model.measuredBattery',
      {
        requireAuthoritative: false,
        today: TODAY,
        allowedKinds: ['review'],
      },
    );
    expect(issues.some((issue) => issue.problem.includes('不被允许'))).toBe(true);
  });

  it('accepts a source whose kind is on the allow list', () => {
    const issues = checkSourcedField(sourced('实测 90 分钟', [REVIEW]), 'model.measuredBattery', {
      requireAuthoritative: false,
      today: TODAY,
      allowedKinds: ['review'],
    });
    expect(issues).toHaveLength(0);
  });
});

describe('checkSourcedFields and formatIssues', () => {
  it('aggregates issues across many fields', () => {
    const issues = checkSourcedFields(
      [
        ['a.sensor', sourced('x', [OFFICIAL])],
        ['b.sensor', sourced('y', [])],
        ['c.sensor', sourced('z', [REVIEW])],
      ],
      OPTIONS,
    );
    expect(issues).toHaveLength(2);
    expect(issues.map((issue) => issue.path)).toEqual(['b.sensor', 'c.sensor']);
  });

  it('renders a clean message when nothing is wrong', () => {
    expect(formatIssues([])).toContain('合规');
  });

  it('renders one line per issue with its path', () => {
    const report = formatIssues([{ path: 'a.price', problem: '缺少来源。' }]);
    expect(report).toBe('- a.price: 缺少来源。');
  });
});
