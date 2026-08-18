import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

/**
 * 端到端链路测试：看玩法 → 挑机型 → 看这台怎么样 → 看实际表现 → 记下选购决定。
 * 只通过用户可见的界面操作驱动，不直接调用内部 API。
 */

function renderApp(): ReturnType<typeof userEvent.setup> {
  const user = userEvent.setup();
  render(<App />);
  return user;
}

/** 直接以某台机型的地址进入 */
function renderAt(hash: string): ReturnType<typeof userEvent.setup> {
  window.location.hash = hash;
  return renderApp();
}

const PRODUCT_ID = 'gopro-hero13-black';
const PRODUCT_NAME = 'GoPro HERO13 Black';

/** 从首页第一张玩法卡进入挑机型页 */
async function pickFirstPlay(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const buttons = await screen.findAllByRole('button', { name: '按这个玩法挑机器' });
  await user.click(buttons[0] as HTMLElement);
  await screen.findByRole('heading', { name: '选型对比' });
}

/** 在当前机型详情页记一条选购决策 */
async function saveDecision(
  user: ReturnType<typeof userEvent.setup>,
  options: { readonly likes?: string; readonly stage?: string } = {},
): Promise<void> {
  await user.click(await screen.findByRole('button', { name: '记进选购清单' }));
  const dialog = await screen.findByRole('dialog');

  if (options.stage !== undefined) {
    await user.selectOptions(within(dialog).getByLabelText('我现在的态度'), options.stage);
  }
  if (options.likes !== undefined) {
    await user.type(within(dialog).getByLabelText('看中它什么'), options.likes);
  }

  await user.click(within(dialog).getByRole('button', { name: '保存记录' }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
}

afterEach(() => {
  window.location.hash = '';
  window.localStorage.clear();
});

describe('站点导航', () => {
  it('默认进入展示玩法的首页，而不是筛选表单', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { name: /运动相机能拍出什么/ })).toBeInTheDocument();
  });

  it('全站只有一处主导航，三大板块并列并标出当前所在的板块', async () => {
    const user = renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });

    expect(screen.getAllByRole('navigation')).toHaveLength(1);

    const nav = screen.getByRole('navigation', { name: '主导航' });
    expect(within(nav).getByRole('link', { name: /^首页/ })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));
    expect(await screen.findByRole('heading', { name: '我的选购' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /^选购笔记/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('购机指南内部的产品详情步骤未选机型时落到默认机型，而不是死链', async () => {
    const user = renderApp();
    const nav = await screen.findByRole('navigation', { name: '主导航' });

    await user.click(within(nav).getByRole('link', { name: '购机指南' }));
    await screen.findByRole('heading', { name: '选型对比' });

    const guideNav = screen.getByRole('region', { name: '购机指南进度' });
    const link = within(guideNav).getByRole('link', { name: /产品详情/ });
    expect(link).toHaveAttribute('href', expect.stringMatching(/^#\/product\/[a-z0-9-]+$/));

    await user.click(link);
    expect(await screen.findByRole('button', { name: '换一台' })).toBeInTheDocument();
  });

  it('无法识别的地址会给出提示并回到默认模块', async () => {
    renderAt('#/nonsense');
    expect(await screen.findByText(/无法识别/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /运动相机能拍出什么/ })).toBeInTheDocument();
  });

  it('机型地址不存在时给出出路，而不是白屏', async () => {
    renderAt('#/product/not-a-real-camera');
    expect(await screen.findByRole('heading', { name: '没找到这台机型' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '回到挑机型' })).toBeInTheDocument();
  });
});

describe('第一步：看能拍什么', () => {
  it('玩法卡给出具体拍法与器材要求', async () => {
    renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });

    expect(screen.getAllByText(/拍法步骤/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/器材建议/).length).toBeGreaterThan(0);
  });

  it('场景图使用品牌官方营销照片', async () => {
    renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAccessibleName(/拍摄场景/);
    expect(images[0]).toHaveAttribute('src', expect.stringMatching(/^\/image\/products\/.+\.jpg$/));
  });

  it('每个玩法都标出现在哪台机型最拍得动它', async () => {
    renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });
    await waitFor(() => {
      expect(screen.getAllByText(/现在最拍得动它的是/).length).toBeGreaterThan(0);
    });
  });

  it('可以按场景只看某一类玩法', async () => {
    const user = renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });

    const filterGroup = screen.getByRole('group', { name: '按场景筛选玩法' });
    const snowButton = within(filterGroup).getByRole('button', { name: '滑雪' });
    await user.click(snowButton);

    expect(snowButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '看全部场景' })).toBeInTheDocument();
  });

  it('可以上传自己的玩法，标注本地数据，并支持删除', async () => {
    const user = renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });

    await user.click(screen.getByRole('button', { name: '上传我的玩法' }));
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByLabelText(/场景名称/), '露营夜拍');
    await user.type(within(dialog).getByLabelText(/玩法名称/), '帐篷延时');
    await user.type(within(dialog).getByLabelText(/怎么拍/), '架在帐篷顶拍星空延时。');
    await user.click(within(dialog).getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('帐篷延时')).toBeInTheDocument();
    expect(screen.getByText('本地数据')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '删除「帐篷延时」' }));
    expect(screen.queryByText('帐篷延时')).not.toBeInTheDocument();
  });
});

describe('第二步：挑一台', () => {
  it('带着玩法进来时预选它的场景，并标出契合度', async () => {
    const user = renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });
    await pickFirstPlay(user);

    expect(screen.getByText('正在为这个玩法挑机器')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/契合度/).length).toBeGreaterThan(0);
    });
  });

  it('可以取消玩法限制回到通用推荐', async () => {
    const user = renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });
    await pickFirstPlay(user);

    await user.click(screen.getByRole('button', { name: '不限玩法' }));
    expect(screen.queryByText('正在为这个玩法挑机器')).not.toBeInTheDocument();
  });

  it('从推荐卡可以直接进入那台机型的详情页', async () => {
    const user = renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });
    await pickFirstPlay(user);

    const buttons = await screen.findAllByRole('button', { name: '看这台怎么样' });
    await user.click(buttons[0] as HTMLElement);

    expect(await screen.findByRole('button', { name: '换一台' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '官方参数' })).toBeInTheDocument();
  });

  it('推荐理由与匹配度算式都对用户公开', async () => {
    const user = renderApp();
    const nav = await screen.findByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '购机指南' }));
    await screen.findByRole('heading', { name: '选型对比' });

    await user.click(screen.getByText('匹配度怎么算'));
    expect(screen.getByText(/加权平均/)).toBeInTheDocument();
  });

  it('技术雷达帮判断哪些技术值不值得等', async () => {
    const user = renderApp();
    const nav = await screen.findByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '购机指南' }));
    await screen.findByRole('heading', { name: '选型对比' });

    expect(await screen.findByText('这些技术值不值得等')).toBeInTheDocument();
  });

  it('未发布机型单独分区，不混入在售推荐', async () => {
    const user = renderApp();
    const nav = await screen.findByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '购机指南' }));
    await screen.findByRole('heading', { name: '选型对比' });

    expect(screen.getByText('尚未发布的机型')).toBeInTheDocument();
    expect(screen.getByText(/未获官方确认/)).toBeInTheDocument();
  });
});

describe('第三步：这台怎么样', () => {
  it('展示六维能力、官方参数与拿手玩法', async () => {
    renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });

    expect(screen.getByRole('heading', { name: /六维能力/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '官方参数' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /它最拿手的玩法/ })).toBeInTheDocument();
  });

  it('参数字段查不到时标为未公开，不填近似值', async () => {
    renderAt('#/product/dji-osmo-360');
    await screen.findByRole('heading', { name: '官方参数' });
    expect(screen.getAllByText('未公开').length).toBeGreaterThan(0);
  });

  it('能力评分附来源，并说明是人工标注而非自动估算', async () => {
    renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: /六维能力/ });
    // 术语注解与口径说明都会提到这句，取任意一处即可
    expect(screen.getAllByText(/不是自动生成的估算值/).length).toBeGreaterThan(0);
  });

  it('短板与强项分开呈现，不只讲好的一面', async () => {
    renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });

    expect(screen.getByRole('heading', { name: '它的短板' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '它的强项' })).toBeInTheDocument();
  });

  it('可以把这台机型记进选购清单', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });

    await saveDecision(user, { likes: '防抖够稳', stage: 'shortlisted' });

    expect(await screen.findByRole('heading', { name: /我对这台的记录/ })).toBeInTheDocument();
    expect(screen.getByText(/防抖够稳/)).toBeInTheDocument();
  });
});

describe('第四步：实际表现', () => {
  it('展示核心数据、社区讨论与问题根因', async () => {
    renderAt(`#/monitor/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(`${PRODUCT_NAME} 的实际表现`) });

    expect(screen.getByRole('heading', { name: /核心数据/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /问题根因/ })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /社区在讨论什么/ })).toBeInTheDocument();
  });

  it('社区反馈保留原贴链接，可点开核对', async () => {
    renderAt(`#/monitor/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: /社区在讨论什么/ });

    const links = screen.getAllByRole('link', { name: /在新窗口打开/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', expect.stringMatching(/^https:\/\//));
  });

  it('根因归因标注为内部分析，不冒充社区原话', async () => {
    renderAt(`#/monitor/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: /问题根因/ });

    expect(screen.getByText(/不是社区用户的原话/)).toBeInTheDocument();
    expect(screen.getAllByText('内部分析').length).toBeGreaterThan(0);
  });

  it('用户录入的反馈会并入根因分析，并标为本地数据', async () => {
    const user = renderAt(`#/monitor/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: /记一条我遇到的情况/ });

    await user.type(screen.getByLabelText('什么场景'), '夜骑');
    await user.type(screen.getByLabelText(/具体情况/), '录到 40 分钟因过热停机');
    await user.selectOptions(screen.getByLabelText('你觉得是哪方面的问题'), 'battery');
    await user.click(screen.getByRole('button', { name: '保存这条反馈' }));

    expect(await screen.findByText(/并入下方的根因分析/)).toBeInTheDocument();
    expect(screen.getAllByText('本地数据').length).toBeGreaterThan(0);
  });

  it('反馈内容为空时拒绝保存并说明原因', async () => {
    const user = renderAt(`#/monitor/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: /记一条我遇到的情况/ });

    await user.click(screen.getByRole('button', { name: '保存这条反馈' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/请先写下/);
  });

  it('已不提供素材上传与画质分析', async () => {
    renderAt(`#/monitor/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: /核心数据/ });

    expect(screen.queryByText(/素材实验室/)).not.toBeInTheDocument();
    // 页脚仍会说明本地数据「不会上传」，因此只断言不存在上传控件本身
    expect(screen.queryByRole('button', { name: /上传/ })).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});

describe('第五步：我的选购', () => {
  it('没有记录时引导用户先去看玩法', async () => {
    const user = renderApp();
    const nav = await screen.findByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));

    expect(await screen.findByRole('heading', { name: '还没有记录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去看玩法' })).toBeInTheDocument();
  });

  it('记下的机型按选购阶段分组展示', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { likes: '防抖够稳', stage: 'shortlisted' });

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));

    expect(await screen.findByRole('heading', { name: /进了候选（1）/ })).toBeInTheDocument();
    expect(screen.getByText(/防抖够稳/)).toBeInTheDocument();
  });

  it('给出倾向建议，并公开这个建议的口径', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { likes: '防抖够稳', stage: 'shortlisted' });

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));

    expect(
      await screen.findByRole('heading', { name: /按你记下的内容，现在最合的是/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/它不替你决定/)).toBeInTheDocument();
  });

  it('可以直接改变某台机型的选购阶段', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { stage: 'shortlisted' });

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));
    await screen.findByRole('heading', { name: /进了候选（1）/ });

    await user.selectOptions(
      screen.getByLabelText(new RegExp(`修改「.*${PRODUCT_NAME}」的选购状态`)),
      'purchased',
    );
    expect(await screen.findByRole('heading', { name: /已入手（1）/ })).toBeInTheDocument();
  });

  it('可以删除一条记录', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { stage: 'shortlisted' });

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));
    await screen.findByRole('heading', { name: /进了候选（1）/ });

    await user.click(screen.getByRole('button', { name: new RegExp(`删除「.*${PRODUCT_NAME}」`) }));
    expect(await screen.findByRole('heading', { name: '还没有记录' })).toBeInTheDocument();
  });

  it('明确区分外部真实数据与本地自建内容', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { stage: 'shortlisted' });

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));
    await screen.findByRole('heading', { name: '我的选购' });

    expect(screen.getAllByText('本地数据').length).toBeGreaterThan(0);
    expect(screen.getByText(/是你自己写的/)).toBeInTheDocument();
  });
});

describe('跨步骤的数据流转', () => {
  it('记过的机型会在挑机型页显示当前状态', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { stage: 'shortlisted' });

    await user.click(screen.getByRole('button', { name: '换一台' }));
    await screen.findByRole('heading', { name: '选型对比' });

    expect(await screen.findByText('我记下的机型')).toBeInTheDocument();
    expect(screen.getAllByText('进了候选').length).toBeGreaterThan(0);
  });

  it('详情页与实际表现页之间可以直接来回', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });

    await user.click(screen.getByRole('button', { name: '看它的实际表现' }));
    await screen.findByRole('heading', { name: new RegExp(`${PRODUCT_NAME} 的实际表现`) });

    await user.click(screen.getByRole('button', { name: '回看它的参数' }));
    expect(await screen.findByRole('heading', { name: '官方参数' })).toBeInTheDocument();
  });

  it('上下文条回显当前机型与我的记录进度', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { stage: 'shortlisted' });

    await user.click(screen.getByRole('button', { name: '看它的实际表现' }));
    const contextBar = await screen.findByRole('region', { name: '当前机型' });
    expect(within(contextBar).getByText(new RegExp(PRODUCT_NAME))).toBeInTheDocument();
    expect(within(contextBar).getByText('进了候选')).toBeInTheDocument();
  });

  it('本地记录在重新加载后仍然存在', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { likes: '防抖够稳', stage: 'shortlisted' });

    // 卸载后重新挂载，模拟刷新页面
    window.location.hash = '#/my';
    render(<App />);

    const headings = await screen.findAllByRole('heading', { name: /进了候选（1）/ });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('清空本地记录后外部数据仍然可用', async () => {
    const user = renderAt(`#/product/${PRODUCT_ID}`);
    await screen.findByRole('heading', { name: new RegExp(PRODUCT_NAME) });
    await saveDecision(user, { stage: 'shortlisted' });

    const nav = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(nav).getByRole('link', { name: '选购笔记' }));
    await screen.findByRole('heading', { name: '我的选购' });

    await user.click(screen.getByRole('button', { name: '清空我的全部记录' }));
    expect(await screen.findByRole('heading', { name: '还没有记录' })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: '购机指南' }));
    expect(await screen.findByRole('heading', { name: '选型对比' })).toBeInTheDocument();
  });
});

describe('全站数据可信度呈现', () => {
  it('页脚声明数据来源、图片版权与本地数据边界', async () => {
    renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });

    expect(screen.getByText(/请以官网为准/)).toBeInTheDocument();
    expect(screen.getByText(/场景图片来自.*版权归各品牌所有/)).toBeInTheDocument();
    expect(screen.getByText(/不会上传/)).toBeInTheDocument();
  });

  it('支持切换深色主题', async () => {
    const user = renderApp();
    await screen.findByRole('heading', { name: /运动相机能拍出什么/ });

    await user.click(screen.getByRole('button', { name: /深色|浅色/ }));
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme');
    });
  });
});
