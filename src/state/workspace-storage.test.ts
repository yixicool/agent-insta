import { describe, expect, it } from 'vitest';
import {
  clearWorkspace,
  isWorkspaceData,
  loadWorkspace,
  migrateWorkspaceData,
  saveWorkspace,
} from './workspace-storage';
import { WORKSPACE_STORAGE_KEY } from '../lib/storage';
import {
  WORKSPACE_SCHEMA_VERSION,
  createEmptyWorkspaceData,
  type WorkspaceData,
} from '../types/workspace';

const AT = '2026-08-05T10:00:00.000Z';

function populated(): WorkspaceData {
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    updatedAt: AT,
    decisions: [
      {
        id: 'decision-1',
        productId: 'dji-osmo-action-6',
        stage: 'shortlisted',
        playIds: ['play-tunnel-exposure'],
        budget: 500,
        likes: ['可变光圈'],
        worries: ['略贵'],
        note: '等降价',
        createdAt: AT,
        updatedAt: AT,
      },
    ],
    feedback: [
      {
        id: 'feedback-1',
        productId: 'dji-osmo-action-6',
        kind: 'problem',
        sceneLabel: '夜骑',
        summary: '录到 40 分钟因过热停机',
        dimension: 'battery',
        severity: 4,
        createdAt: AT,
      },
    ],
    userPlays: [
      {
        id: 'user-play-1',
        sceneLabel: '露营夜拍',
        name: '帐篷延时',
        summary: '架在帐篷顶拍星空延时。',
        imageDataUrl: null,
        createdAt: AT,
      },
    ],
  };
}

describe('isWorkspaceData', () => {
  it('accepts an empty workspace at the current version', () => {
    expect(isWorkspaceData(createEmptyWorkspaceData(AT))).toBe(true);
  });

  it('accepts fully populated data', () => {
    expect(isWorkspaceData(populated())).toBe(true);
  });

  it('rejects a mismatched schema version so old shapes never reach the reducer', () => {
    expect(isWorkspaceData({ ...populated(), schemaVersion: 1 })).toBe(false);
    expect(isWorkspaceData({ ...populated(), schemaVersion: 99 })).toBe(false);
  });

  it('rejects non-objects', () => {
    for (const value of [null, undefined, 'x', 42, []]) {
      expect(isWorkspaceData(value)).toBe(false);
    }
  });

  it('rejects a decision note with an unknown stage', () => {
    const data = populated();
    const broken = {
      ...data,
      decisions: [{ ...data.decisions[0], stage: 'nonsense' }],
    };
    expect(isWorkspaceData(broken)).toBe(false);
  });

  it('rejects a decision note missing its id', () => {
    const data = populated();
    const first = data.decisions[0];
    if (first === undefined) {
      throw new Error('测试数据缺少决策记录');
    }
    const { id: _id, ...withoutId } = first;
    expect(isWorkspaceData({ ...data, decisions: [withoutId] })).toBe(false);
  });

  it('rejects a decision note whose text lists are not arrays of strings', () => {
    const data = populated();
    expect(isWorkspaceData({ ...data, decisions: [{ ...data.decisions[0], likes: [1, 2] }] })).toBe(
      false,
    );
  });

  it('accepts a null budget but rejects a non-numeric one', () => {
    const data = populated();
    expect(isWorkspaceData({ ...data, decisions: [{ ...data.decisions[0], budget: null }] })).toBe(
      true,
    );
    expect(isWorkspaceData({ ...data, decisions: [{ ...data.decisions[0], budget: '500' }] })).toBe(
      false,
    );
  });

  it('rejects feedback with an unknown capability dimension', () => {
    const data = populated();
    expect(
      isWorkspaceData({ ...data, feedback: [{ ...data.feedback[0], dimension: 'nonsense' }] }),
    ).toBe(false);
  });

  it('rejects feedback with an unknown kind', () => {
    const data = populated();
    expect(isWorkspaceData({ ...data, feedback: [{ ...data.feedback[0], kind: 'rant' }] })).toBe(
      false,
    );
  });

  it('rejects data missing a whole collection', () => {
    const { decisions: _decisions, ...withoutDecisions } = populated();
    expect(isWorkspaceData(withoutDecisions)).toBe(false);
  });

  it('accepts a user play with no image and rejects one missing a required field', () => {
    const data = populated();
    expect(isWorkspaceData(data)).toBe(true);

    const { name: _name, ...withoutName } = data.userPlays[0] as (typeof data.userPlays)[0];
    expect(isWorkspaceData({ ...data, userPlays: [withoutName] })).toBe(false);
  });

  it('rejects a user play whose imageDataUrl is neither a string nor null', () => {
    const data = populated();
    expect(
      isWorkspaceData({ ...data, userPlays: [{ ...data.userPlays[0], imageDataUrl: 42 }] }),
    ).toBe(false);
  });
});

describe('migrateWorkspaceData', () => {
  it('upgrades v1 and v2 data to the current version', () => {
    for (const version of [1, 2]) {
      const migrated = migrateWorkspaceData({
        schemaVersion: version,
        insights: [{ id: 'insight-1', title: '旧洞察' }],
        requirements: [],
        assets: [],
        acceptances: [],
        updatedAt: AT,
      });
      expect(isWorkspaceData(migrated)).toBe(true);
    }
  });

  it('starts the new structure empty rather than inventing shopping intent from old PM records', () => {
    const migrated = migrateWorkspaceData({
      schemaVersion: 2,
      insights: [{ id: 'insight-1', title: '夜骑低光噪点' }],
      requirements: [{ id: 'req-1', title: '低光降噪' }],
      assets: [],
      acceptances: [],
      updatedAt: AT,
    });
    if (!isWorkspaceData(migrated)) {
      throw new Error('迁移后的数据未通过守卫');
    }
    expect(migrated.decisions).toHaveLength(0);
    expect(migrated.feedback).toHaveLength(0);
  });

  it('preserves the original updatedAt when it is usable', () => {
    const migrated = migrateWorkspaceData({ schemaVersion: 1, updatedAt: AT });
    if (!isWorkspaceData(migrated)) {
      throw new Error('迁移后的数据未通过守卫');
    }
    expect(migrated.updatedAt).toBe(AT);
  });

  it('leaves current-version data untouched', () => {
    const data = populated();
    expect(migrateWorkspaceData(data)).toBe(data);
  });

  it('upgrades v3 data to v4 by adding an empty userPlays without touching decisions/feedback', () => {
    const v3 = {
      schemaVersion: 3,
      decisions: [
        {
          id: 'decision-1',
          productId: 'dji-osmo-action-6',
          stage: 'shortlisted',
          playIds: [],
          budget: null,
          likes: ['低光够用'],
          worries: [],
          note: '',
          createdAt: AT,
          updatedAt: AT,
        },
      ],
      feedback: [],
      updatedAt: AT,
    };
    const migrated = migrateWorkspaceData(v3);
    if (!isWorkspaceData(migrated)) {
      throw new Error('迁移后的数据未通过守卫');
    }
    expect(migrated.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION);
    expect(migrated.decisions).toHaveLength(1);
    expect(migrated.decisions[0]?.likes).toEqual(['低光够用']);
    expect(migrated.userPlays).toEqual([]);
  });

  it('passes an unknown version through so the guard can reject it', () => {
    const unknown = { schemaVersion: 99, decisions: [], feedback: [], updatedAt: AT };
    expect(migrateWorkspaceData(unknown)).toBe(unknown);
    expect(isWorkspaceData(migrateWorkspaceData(unknown))).toBe(false);
  });

  it('passes non-objects through unchanged', () => {
    expect(migrateWorkspaceData('nope')).toBe('nope');
    expect(migrateWorkspaceData(null)).toBeNull();
  });
});

describe('load / save / clear round trip', () => {
  it('persists and restores data unchanged', () => {
    const data = populated();
    expect(saveWorkspace(data).ok).toBe(true);

    const loaded = loadWorkspace();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data).toEqual(data);
    }
  });

  it('reports not-found on a first visit instead of erroring', () => {
    const result = loadWorkspace();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not-found');
    }
  });

  it('rejects corrupted JSON with a schema-mismatch style failure', () => {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, '{not json');
    const result = loadWorkspace();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('schema-mismatch');
    }
  });

  it('upgrades v2 data on load rather than failing outright', () => {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        insights: [{ id: 'insight-1', title: '夜骑低光噪点', productId: null }],
        requirements: [],
        assets: [],
        acceptances: [],
        updatedAt: AT,
      }),
    );

    const result = loadWorkspace();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION);
      expect(result.data.decisions).toHaveLength(0);
    }
  });

  it('clears the stored payload', () => {
    expect(saveWorkspace(populated()).ok).toBe(true);
    expect(clearWorkspace().ok).toBe(true);

    const result = loadWorkspace();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not-found');
    }
  });
});
