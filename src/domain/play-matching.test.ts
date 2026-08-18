import { describe, expect, it } from 'vitest';
import {
  PLAY_FIT_NOTE,
  PLAY_FIT_THRESHOLD,
  describePlayDemands,
  describePlayFit,
  rankModelsForPlay,
  rankPlaysForModel,
  scorePlayFit,
} from './play-matching';
import { COMPETITOR_MODELS } from '../data/competitors';
import { PLAY_STYLES } from '../data/plays';
import { FLAT_CAPABILITIES, buildModel, buildPlay } from '../test/fixtures';

describe('scorePlayFit', () => {
  it('只按玩法依赖的维度打分，无关维度不影响结果', () => {
    const play = buildPlay({ id: 'play', audience: 'cycling', demands: ['lowLight'] });
    // 两台机型低光相同，其余维度差异巨大
    const balanced = buildModel({
      id: 'balanced',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 80 },
    });
    const lopsided = buildModel({
      id: 'lopsided',
      capabilities: {
        lowLight: 80,
        stabilization: 10,
        battery: 10,
        ruggedness: 10,
        portability: 10,
        creativeFlexibility: 10,
      },
    });

    expect(scorePlayFit(play, balanced).score).toBe(scorePlayFit(play, lopsided).score);
  });

  it('多个依赖维度取平均', () => {
    const play = buildPlay({
      id: 'play',
      audience: 'cycling',
      demands: ['lowLight', 'battery'],
    });
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 90, battery: 50 },
    });
    expect(scorePlayFit(play, model).score).toBe(70);
  });

  it('命中官方定位人群时加 5 分', () => {
    const play = buildPlay({ id: 'play', audience: 'snow', demands: ['lowLight'] });
    const hit = buildModel({
      id: 'hit',
      targetAudiences: ['snow'],
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 60 },
    });
    const miss = buildModel({
      id: 'miss',
      targetAudiences: ['water'],
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 60 },
    });

    expect(scorePlayFit(play, hit).score).toBe(65);
    expect(scorePlayFit(play, miss).score).toBe(60);
    expect(scorePlayFit(play, hit).audienceHit).toBe(true);
  });

  it('加分后不会超过 100', () => {
    const play = buildPlay({ id: 'play', audience: 'snow', demands: ['lowLight'] });
    const model = buildModel({
      id: 'model',
      targetAudiences: ['snow'],
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 100 },
    });
    expect(scorePlayFit(play, model).score).toBe(100);
  });

  it('玩法没有指定依赖维度时退化为六维平均', () => {
    const play = buildPlay({ id: 'play', audience: 'cycling', demands: [] });
    const model = buildModel({ id: 'model' });
    expect(scorePlayFit(play, model).score).toBe(50);
  });

  it('标出依赖维度中最强与最弱的一项', () => {
    const play = buildPlay({
      id: 'play',
      audience: 'cycling',
      demands: ['lowLight', 'battery'],
    });
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 90, battery: 20 },
    });
    const fit = scorePlayFit(play, model);
    expect(fit.bestDimension).toBe('lowLight');
    expect(fit.weakestDimension).toBe('battery');
  });

  it('只依赖一个维度时不虚构「最弱项」', () => {
    const play = buildPlay({ id: 'play', audience: 'cycling', demands: ['lowLight'] });
    const fit = scorePlayFit(play, buildModel({ id: 'model' }));
    expect(fit.bestDimension).toBe('lowLight');
    expect(fit.weakestDimension).toBeNull();
  });
});

describe('rankModelsForPlay', () => {
  it('契合度高的排在前面', () => {
    const play = buildPlay({ id: 'play', audience: 'cycling', demands: ['battery'] });
    const weak = buildModel({ id: 'weak', capabilities: { ...FLAT_CAPABILITIES, battery: 30 } });
    const strong = buildModel({
      id: 'strong',
      capabilities: { ...FLAT_CAPABILITIES, battery: 95 },
    });

    const ranked = rankModelsForPlay(play, [weak, strong]);
    expect(ranked.map((fit) => fit.model.id)).toEqual(['strong', 'weak']);
  });

  it('不修改传入的数组', () => {
    const play = buildPlay({ id: 'play', audience: 'cycling', demands: ['battery'] });
    const models = [
      buildModel({ id: 'a', capabilities: { ...FLAT_CAPABILITIES, battery: 10 } }),
      buildModel({ id: 'b', capabilities: { ...FLAT_CAPABILITIES, battery: 90 } }),
    ];
    rankModelsForPlay(play, models);
    expect(models.map((model) => model.id)).toEqual(['a', 'b']);
  });

  it('机型列表为空时返回空数组', () => {
    const play = buildPlay({ id: 'play', audience: 'cycling', demands: ['battery'] });
    expect(rankModelsForPlay(play, [])).toHaveLength(0);
  });
});

describe('rankPlaysForModel', () => {
  it('这台机器最拍得动的玩法排在前面', () => {
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, portability: 95, lowLight: 20 },
    });
    const lightweight = buildPlay({
      id: 'lightweight',
      audience: 'trail-running',
      demands: ['portability'],
    });
    const nightShot = buildPlay({
      id: 'night',
      audience: 'cycling',
      demands: ['lowLight'],
    });

    const ranked = rankPlaysForModel(model, [nightShot, lightweight]);
    expect(ranked[0]?.play.id).toBe('lightweight');
  });

  it('两个方向对同一组合给出相同分数', () => {
    const play = buildPlay({ id: 'play', audience: 'snow', demands: ['ruggedness'] });
    const model = buildModel({
      id: 'model',
      targetAudiences: ['snow'],
      capabilities: { ...FLAT_CAPABILITIES, ruggedness: 77 },
    });

    const fromPlay = rankModelsForPlay(play, [model])[0];
    const fromModel = rankPlaysForModel(model, [play])[0];
    expect(fromPlay?.score).toBe(fromModel?.score);
  });
});

describe('describePlayFit', () => {
  it('契合度达标时说明为什么适合', () => {
    const play = buildPlay({ id: 'play', audience: 'snow', demands: ['ruggedness'] });
    const model = buildModel({
      id: 'model',
      targetAudiences: ['snow'],
      capabilities: { ...FLAT_CAPABILITIES, ruggedness: 90 },
    });
    const text = describePlayFit(scorePlayFit(play, model));
    expect(text).toContain('适合');
    expect(text).toContain('官方');
  });

  it('契合度不达标时点出瓶颈维度', () => {
    const play = buildPlay({
      id: 'play',
      audience: 'cycling',
      demands: ['lowLight', 'battery'],
    });
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 40, battery: 20 },
    });
    const fit = scorePlayFit(play, model);
    expect(fit.score).toBeLessThan(PLAY_FIT_THRESHOLD);
    const text = describePlayFit(fit);
    expect(text).toContain('吃力');
    expect(text).toContain('续航');
  });
});

describe('describePlayDemands', () => {
  it('列出依赖的维度中文名', () => {
    const play = buildPlay({
      id: 'play',
      audience: 'cycling',
      demands: ['lowLight', 'stabilization'],
    });
    const text = describePlayDemands(play);
    expect(text).toContain('低光画质');
    expect(text).toContain('防抖');
  });

  it('没有依赖维度时说明对机器没有特别偏好', () => {
    const play = buildPlay({ id: 'play', audience: 'cycling', demands: [] });
    expect(describePlayDemands(play)).toContain('没有特别偏好');
  });
});

describe('真实数据上的表现', () => {
  it('每个真实玩法在每台真实机型上都能得出 0-100 的分数', () => {
    for (const play of PLAY_STYLES) {
      for (const model of COMPETITOR_MODELS) {
        const { score } = scorePlayFit(play, model);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('每个真实玩法都至少有一台机型拍得动，否则这个玩法不该出现在首页', () => {
    for (const play of PLAY_STYLES) {
      const best = rankModelsForPlay(play, COMPETITOR_MODELS)[0];
      expect(best?.score).toBeGreaterThanOrEqual(PLAY_FIT_THRESHOLD);
    }
  });
});

describe('PLAY_FIT_NOTE', () => {
  it('对用户公开算式与加分规则', () => {
    expect(PLAY_FIT_NOTE).toContain('平均分');
    expect(PLAY_FIT_NOTE).toContain('5 分');
  });
});
