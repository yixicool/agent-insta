import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextBar } from './ContextBar';
import { CollapsibleSection, Disclosure } from './Disclosure';
import { FlowBar } from './FlowBar';
import { Term } from './Glossary';
import { GuideSubNav } from './GuideSubNav';
import { OverviewStats } from './Overview';
import { ProductPhoto } from './ProductPhoto';
import { SCENE_ART_KEYS, SCENE_ART_URLS, SceneArt } from './SceneArt';
import { UploadPlayCard, UserPlayCard } from './UserPlays';
import { COMPETITOR_MODELS } from '../data/competitors';
import { GENERAL_WORDING } from '../lib/wording';
import type { Route } from '../state/use-hash-route';
import type { UserPlay } from '../types/user-play';

describe('Disclosure', () => {
  it('隐藏内容直到用户展开', async () => {
    const user = userEvent.setup();
    render(
      <Disclosure summary="查看全部参数">
        <p>传感器尺寸 1/1.1 英寸</p>
      </Disclosure>,
    );

    const trigger = screen.getByText('查看全部参数');
    // 原生 details 未展开时内容不可见，但仍在无障碍树中
    expect(trigger.closest('details')).not.toHaveAttribute('open');

    await user.click(trigger);
    expect(trigger.closest('details')).toHaveAttribute('open');
    expect(screen.getByText('传感器尺寸 1/1.1 英寸')).toBeVisible();
  });

  it('显示条目数让用户预期内容量', () => {
    render(
      <Disclosure summary="数据来源" count={3}>
        <p>内容</p>
      </Disclosure>,
    );
    expect(screen.getByText('（3）')).toBeInTheDocument();
  });

  it('defaultOpen 时初始即展开', () => {
    render(
      <Disclosure summary="怎么拍" defaultOpen>
        <p>第一步</p>
      </Disclosure>,
    );
    expect(screen.getByText('怎么拍').closest('details')).toHaveAttribute('open');
  });
});

describe('CollapsibleSection', () => {
  it('标题与说明同时可见，内容默认收起', () => {
    render(
      <CollapsibleSection title="行业动向" description="6 条 · 真实产品动作">
        <p>大底下沉</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('行业动向')).toBeInTheDocument();
    expect(screen.getByText('6 条 · 真实产品动作')).toBeInTheDocument();
    expect(screen.getByText('行业动向').closest('details')).not.toHaveAttribute('open');
  });
});

describe('OverviewStats', () => {
  it('渲染每个指标的标签、数值与补充说明', () => {
    render(
      <OverviewStats
        items={[{ label: '综合能力', value: '84.5', hint: '第一梯队' }]}
        summary="这台机器的短板在续航。"
      />,
    );
    expect(screen.getByText('综合能力')).toBeInTheDocument();
    expect(screen.getByText('84.5')).toBeInTheDocument();
    expect(screen.getByText('第一梯队')).toBeInTheDocument();
    expect(screen.getByText('这台机器的短板在续航。')).toBeInTheDocument();
  });

  it('可挂载操作按钮', () => {
    render(
      <OverviewStats
        items={[{ label: '我记下的机型', value: '2 款' }]}
        action={<button type="button">再挑一台</button>}
      />,
    );
    expect(screen.getByRole('button', { name: '再挑一台' })).toBeInTheDocument();
  });
});

describe('Term', () => {
  it('显示大白话说法，并把术语与口径留给辅助技术', () => {
    render(<Term wording={GENERAL_WORDING.openGate} />);

    expect(screen.getByText('全画幅读出')).toBeInTheDocument();
    const abbr = screen.getByTitle(/open-gate/);
    expect(abbr).toBeInTheDocument();
    expect(abbr.textContent).toContain('open-gate');
  });

  it('每个术语都能渲染出对应的大白话标签', () => {
    for (const wording of Object.values(GENERAL_WORDING)) {
      const { unmount } = render(<Term wording={wording} />);
      expect(screen.getByText(wording.plain)).toBeInTheDocument();
      unmount();
    }
  });
});

describe('SceneArt', () => {
  it('为场景图片提供说明性的无障碍标签', () => {
    render(<SceneArt artKey="night-road" />);
    const image = screen.getByRole('img');
    expect(image).toHaveAccessibleName(/夜间道路拍摄场景/);
    expect(image).toHaveAttribute('src', SCENE_ART_URLS['night-road']);
  });

  it('每个已声明的形态键都能渲染出图片', () => {
    for (const key of SCENE_ART_KEYS) {
      const { unmount } = render(<SceneArt artKey={key} />);
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', SCENE_ART_URLS[key]);
      unmount();
    }
  });

  it('图片使用懒加载优化首屏性能', () => {
    render(<SceneArt artKey="panorama" />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'lazy');
  });
});

describe('ProductPhoto', () => {
  const template = COMPETITOR_MODELS[0];
  if (template === undefined) {
    throw new Error('竞品数据为空，测试模板无法构建');
  }

  it('没有登记图片路径时退回形态示意图', () => {
    render(<ProductPhoto model={{ ...template, imagePath: null }} />);
    expect(screen.queryByRole('img', { name: /产品图/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '产品形态示意图' })).toBeInTheDocument();
  });

  it('有登记图片路径时渲染真实产品图', () => {
    render(<ProductPhoto model={{ ...template, imagePath: '/images/products/sample.jpg' }} />);
    const image = screen.getByRole('img', { name: /官方产品图/ });
    expect(image).toHaveAttribute('src', '/images/products/sample.jpg');
    expect(image).toHaveAccessibleName(new RegExp(template.name));
  });

  it('图片加载失败时退回形态示意图，不留破图', () => {
    render(<ProductPhoto model={{ ...template, imagePath: '/images/products/broken.jpg' }} />);
    const image = screen.getByRole('img', { name: /官方产品图/ });
    fireEvent.error(image);
    expect(screen.queryByRole('img', { name: /官方产品图/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '产品形态示意图' })).toBeInTheDocument();
  });
});

const HOME: Route = { id: 'home', productId: null };

describe('FlowBar', () => {
  it('把三大板块渲染成并列的入口', () => {
    render(<FlowBar current={HOME} onNavigate={() => undefined} />);
    const nav = screen.getByRole('navigation', { name: '主导航' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(3);
    expect(within(nav).getByRole('link', { name: /^首页/ })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /^购机指南/ })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /^选购笔记/ })).toBeInTheDocument();
  });

  it('用 aria-current="page" 标出当前板块，而不是顺序步骤', () => {
    render(<FlowBar current={HOME} onNavigate={() => undefined} />);
    const nav = screen.getByRole('navigation', { name: '主导航' });
    expect(within(nav).getByRole('link', { name: /^首页/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: /^购机指南/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('产品详情、性能监控与选型对比同属购机指南，都会高亮该标签', () => {
    for (const current of [
      { id: 'picker', productId: null } as const,
      { id: 'product', productId: 'insta360-x5' } as const,
      { id: 'monitor', productId: 'insta360-x5' } as const,
    ]) {
      const { unmount } = render(<FlowBar current={current} onNavigate={() => undefined} />);
      expect(screen.getByRole('link', { name: /^购机指南/ })).toHaveAttribute(
        'aria-current',
        'page',
      );
      unmount();
    }
  });

  it('点击购机指南会触发导航到选型对比页，而不是走浏览器默认跳转', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<FlowBar current={HOME} onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: /^购机指南/ }));
    expect(onNavigate).toHaveBeenCalledWith({ id: 'picker', productId: null });
  });

  it('购机指南的链接固定指向选型对比页，无论当前停在这三步的哪一步', () => {
    render(
      <FlowBar
        current={{ id: 'monitor', productId: 'insta360-x5' }}
        onNavigate={() => undefined}
      />,
    );
    expect(screen.getByRole('link', { name: /^购机指南/ })).toHaveAttribute('href', '#/picker');
  });
});

describe('GuideSubNav', () => {
  const PICKER: Route = { id: 'picker', productId: null };

  it('把三步渲染成一条有序的子流程', () => {
    render(
      <GuideSubNav
        current={PICKER}
        onNavigate={() => undefined}
        activeProductId="insta360-x5"
        isDefaultProduct={false}
      />,
    );
    const section = screen.getByRole('region', { name: '购机指南进度' });
    expect(within(section).getAllByRole('listitem')).toHaveLength(3);
    expect(within(section).getByRole('link', { name: /选型对比/ })).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: /产品详情/ })).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: /性能监控/ })).toBeInTheDocument();
  });

  it('不引入第二处主导航landmark', () => {
    render(
      <GuideSubNav
        current={PICKER}
        onNavigate={() => undefined}
        activeProductId="insta360-x5"
        isDefaultProduct={false}
      />,
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('用 aria-current="step" 标出当前步骤', () => {
    render(
      <GuideSubNav
        current={{ id: 'monitor', productId: 'insta360-x5' }}
        onNavigate={() => undefined}
        activeProductId="insta360-x5"
        isDefaultProduct={false}
      />,
    );
    const section = screen.getByRole('region', { name: '购机指南进度' });
    expect(within(section).getByRole('link', { name: /性能监控/ })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(within(section).getByRole('link', { name: /选型对比/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('点击其他步骤会触发导航而不是走浏览器默认跳转', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <GuideSubNav
        current={PICKER}
        onNavigate={onNavigate}
        activeProductId="insta360-x5"
        isDefaultProduct={false}
      />,
    );

    await user.click(screen.getByRole('link', { name: /产品详情/ }));
    expect(onNavigate).toHaveBeenCalledWith({ id: 'product', productId: 'insta360-x5' });
  });

  it('带机型段的步骤指向当前机型', () => {
    render(
      <GuideSubNav
        current={PICKER}
        onNavigate={() => undefined}
        activeProductId="dji-osmo-action-6"
        isDefaultProduct={false}
      />,
    );
    expect(screen.getByRole('link', { name: /产品详情/ })).toHaveAttribute(
      'href',
      '#/product/dji-osmo-action-6',
    );
    expect(screen.getByRole('link', { name: /性能监控/ })).toHaveAttribute(
      'href',
      '#/monitor/dji-osmo-action-6',
    );
  });

  it('用默认机型时相关步骤依然可点，并标注这是默认机型', () => {
    render(
      <GuideSubNav
        current={PICKER}
        onNavigate={() => undefined}
        activeProductId="dji-osmo-action-6"
        isDefaultProduct
      />,
    );
    const link = screen.getByRole('link', { name: /产品详情/ });
    expect(link).toHaveAttribute('href', '#/product/dji-osmo-action-6');
    expect(within(link).getByText('默认')).toBeInTheDocument();
  });

  it('显式选过机型后不再标注默认', () => {
    render(
      <GuideSubNav
        current={PICKER}
        onNavigate={() => undefined}
        activeProductId="dji-osmo-action-6"
        isDefaultProduct={false}
      />,
    );
    const link = screen.getByRole('link', { name: /产品详情/ });
    expect(within(link).queryByText('默认')).not.toBeInTheDocument();
  });

  it('没有可用机型时带机型段的步骤退回选型对比页，不产生死链', () => {
    render(
      <GuideSubNav
        current={PICKER}
        onNavigate={() => undefined}
        activeProductId={null}
        isDefaultProduct={false}
      />,
    );
    expect(screen.getByRole('link', { name: /产品详情/ })).toHaveAttribute('href', '#/picker');
    expect(screen.getByRole('link', { name: /性能监控/ })).toHaveAttribute('href', '#/picker');
  });
});

describe('ContextBar', () => {
  it('回显机型名、选购状态与反馈条数', () => {
    render(
      <ContextBar
        productId="insta360-x5"
        productName="影石 Insta360 X5"
        stage="shortlisted"
        feedbackCount={3}
        isOnProductPage={false}
        onNavigate={() => undefined}
      />,
    );
    expect(screen.getByText('影石 Insta360 X5')).toBeInTheDocument();
    expect(screen.getByText('进了候选')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('还没记录时明说没进清单，而不是留空', () => {
    render(
      <ContextBar
        productId="insta360-x5"
        productName="影石 Insta360 X5"
        stage={null}
        feedbackCount={0}
        isOnProductPage={false}
        onNavigate={() => undefined}
      />,
    );
    expect(screen.getByText('还没记进选购清单')).toBeInTheDocument();
  });

  it('机型库仍在加载时退化为显示 id', () => {
    render(
      <ContextBar
        productId="insta360-x5"
        productName={null}
        stage={null}
        feedbackCount={0}
        isOnProductPage={false}
        onNavigate={() => undefined}
      />,
    );
    expect(screen.getByText('insta360-x5')).toBeInTheDocument();
  });

  it('已经停在详情页时不再显示回详情页的链接', () => {
    render(
      <ContextBar
        productId="insta360-x5"
        productName="影石 Insta360 X5"
        stage={null}
        feedbackCount={0}
        isOnProductPage
        onNavigate={() => undefined}
      />,
    );
    expect(screen.queryByRole('link', { name: '回到它的详情页' })).not.toBeInTheDocument();
  });

  it('点击回详情页触发受控导航', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <ContextBar
        productId="insta360-x5"
        productName="影石 Insta360 X5"
        stage={null}
        feedbackCount={0}
        isOnProductPage={false}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole('link', { name: '回到它的详情页' }));
    expect(onNavigate).toHaveBeenCalledWith({ id: 'product', productId: 'insta360-x5' });
  });
});

const SAMPLE_USER_PLAY: UserPlay = {
  id: 'user-play-1',
  sceneLabel: '露营夜拍',
  name: '帐篷延时',
  summary: '架在帐篷顶拍星空延时。',
  imageDataUrl: null,
  createdAt: '2026-08-13T00:00:00.000Z',
};

describe('UserPlayCard', () => {
  it('展示玩法内容并标注本地数据', () => {
    render(<UserPlayCard play={SAMPLE_USER_PLAY} onRemove={() => undefined} />);
    expect(screen.getByText('帐篷延时')).toBeInTheDocument();
    expect(screen.getByText('露营夜拍')).toBeInTheDocument();
    expect(screen.getByText('架在帐篷顶拍星空延时。')).toBeInTheDocument();
    expect(screen.getByText('本地数据')).toBeInTheDocument();
  });

  it('没有配图时显示占位块而不是空白', () => {
    render(<UserPlayCard play={SAMPLE_USER_PLAY} onRemove={() => undefined} />);
    expect(screen.getByText('未配图')).toBeInTheDocument();
  });

  it('有配图时渲染图片而不是占位块', () => {
    render(
      <UserPlayCard
        play={{ ...SAMPLE_USER_PLAY, imageDataUrl: 'data:image/png;base64,xyz' }}
        onRemove={() => undefined}
      />,
    );
    expect(screen.queryByText('未配图')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,xyz');
  });

  it('点击删除会触发回调', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<UserPlayCard play={SAMPLE_USER_PLAY} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: '删除「帐篷延时」' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe('UploadPlayCard', () => {
  it('点击入口卡打开上传表单', async () => {
    const user = userEvent.setup();
    render(<UploadPlayCard onSubmit={() => undefined} />);
    await user.click(screen.getByRole('button', { name: '上传我的玩法' }));
    expect(screen.getByRole('dialog', { name: '上传我的玩法' })).toBeInTheDocument();
  });

  it('必填字段留空时拒绝提交', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UploadPlayCard onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: '上传我的玩法' }));
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('场景名称、玩法名称与怎么拍都要填才能上传。')).toBeInTheDocument();
  });

  it('填完必填字段后提交，成功后关闭弹窗并清空草稿', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UploadPlayCard onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: '上传我的玩法' }));

    await user.type(screen.getByLabelText(/场景名称/), '露营夜拍');
    await user.type(screen.getByLabelText(/玩法名称/), '帐篷延时');
    await user.type(screen.getByLabelText(/怎么拍/), '架在帐篷顶拍星空延时。');
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      sceneLabel: '露营夜拍',
      name: '帐篷延时',
      summary: '架在帐篷顶拍星空延时。',
      imageDataUrl: null,
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('点击取消关闭弹窗且不提交', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UploadPlayCard onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: '上传我的玩法' }));
    await user.type(screen.getByLabelText(/场景名称/), '露营夜拍');
    await user.click(screen.getByRole('button', { name: '取消' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
