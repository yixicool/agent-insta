import { AUDIENCE_SCENARIOS } from '../data/audiences';
import { COMPETITOR_MODELS } from '../data/competitors';
import { PLAY_STYLES } from '../data/plays';
import { CAPTURED_AT } from '../data/sources';
import { TECH_RADAR } from '../data/tech-radar';
import { INDUSTRY_TRENDS, RUMOR_ENTRIES } from '../data/trends';
import type { AudienceScenario } from '../types/audience';
import type { CompetitorSnapshot } from '../types/competitor';
import type { PlayStyle } from '../types/play';
import type { TrendRadar } from '../types/tech-radar';
import { fail, ok, type ErrorCode, type Result } from '../types/result';
import type { AgentGateway } from './agent-gateway';

/**
 * 默认网关实现：返回构建期内联的已核实真实数据。
 *
 * 注入可控延迟以便 UI 展示真实的加载态；
 * failNext 用于演示与测试失败路径，不会在正常流程中触发。
 */

const DEFAULT_LATENCY_MS = 220;

export interface StaticGatewayOptions {
  /** 每次请求的模拟延迟，测试中设为 0 */
  readonly latencyMs?: number;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class StaticAgentGateway implements AgentGateway {
  private readonly latencyMs: number;
  /** 下一次请求要强制失败的错误码，消费后自动清空 */
  private pendingFailure: ErrorCode | null = null;

  constructor(options: StaticGatewayOptions = {}) {
    this.latencyMs = options.latencyMs ?? DEFAULT_LATENCY_MS;
  }

  /** 让下一次请求失败，用于演示与验证失败态 UI */
  failNext(code: ErrorCode): void {
    this.pendingFailure = code;
  }

  private consumeFailure<T>(): Result<T> | null {
    const code = this.pendingFailure;
    if (code === null) {
      return null;
    }
    this.pendingFailure = null;
    return fail(
      code,
      '数据服务当前不可用。',
      '这是为演示失败态而主动触发的错误，可点击重试按钮重新加载。',
    );
  }

  async fetchCompetitorSnapshot(): Promise<Result<CompetitorSnapshot>> {
    await delay(this.latencyMs);
    const failure = this.consumeFailure<CompetitorSnapshot>();
    if (failure !== null) {
      return failure;
    }
    return ok({
      capturedAt: CAPTURED_AT,
      models: COMPETITOR_MODELS,
      trends: INDUSTRY_TRENDS,
      rumors: RUMOR_ENTRIES,
    });
  }

  async fetchTrendRadar(): Promise<Result<TrendRadar>> {
    await delay(this.latencyMs);
    const failure = this.consumeFailure<TrendRadar>();
    if (failure !== null) {
      return failure;
    }
    return ok(TECH_RADAR);
  }

  async fetchAudienceScenarios(): Promise<Result<readonly AudienceScenario[]>> {
    await delay(this.latencyMs);
    const failure = this.consumeFailure<readonly AudienceScenario[]>();
    if (failure !== null) {
      return failure;
    }
    return ok(AUDIENCE_SCENARIOS);
  }

  async fetchPlayStyles(): Promise<Result<readonly PlayStyle[]>> {
    await delay(this.latencyMs);
    const failure = this.consumeFailure<readonly PlayStyle[]>();
    if (failure !== null) {
      return failure;
    }
    return ok(PLAY_STYLES);
  }
}

export function createStaticGateway(options: StaticGatewayOptions = {}): StaticAgentGateway {
  return new StaticAgentGateway(options);
}
