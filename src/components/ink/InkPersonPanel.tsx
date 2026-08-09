import { useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  natureKeys,
  natureLabels,
  wuxiaAttributeKeys,
  wuxiaAttributeLabels,
} from '@interfaces/lifeEngine';
import { getGearDef, WEAPON_KIND_LABEL } from '@data/equipment/catalog';
import {
  RARITY_SHORT,
  SLOT_LABEL,
  displayGearName,
  formatAffixDisplay,
  gearTitleBits,
  listGearAffixes,
  summarizeAffixTotals,
} from '@data/equipment/affixes';
import { gearTotals, sumGearCombatBonuses, previewEquipDelta, combatPowerScore } from '@core/life/equipment';
import { MOVE_STANCE_LABEL, resolveMoveStance } from '@core/life/moveStance';
import { skillDisplay } from '@core/life/flavor';
import { formatSkillEffects, getSkillDef, skillKindLabel } from '@data/skills/catalog';
import { ensureNature, dominantNature, natureSummary } from '@core/life/nature';
import { getLifeStageLabel } from '@core/life/stages';
import { playerEvasionPercent } from '@core/life/jianghuHints';
import { listKnownNpcLines } from '@core/life/npcCatalog';
import { grudgeKindLabel, listGrudges } from '@core/life/grudgeBook';
import { listWeaponMasteries } from '@core/life/weaponMastery';
import { careerLabel, getCareer } from '@core/life/careers';
import { formatFragmentProgress } from '@core/life/manualFragments';
import { getMasterName } from '@core/life/bonds';
import { getHeirName, listChildNames, previewInheritanceMoney } from '@core/life/family';
import { buildGenealogy } from '@core/life/genealogy';

export type PersonView =
  | 'main'
  | 'attrs'
  | 'skills'
  | 'gear'
  | 'genealogy'
  | 'people'
  | 'grudges'
  | 'roots';

type Props = {
  state: LifeGameState;
  view: PersonView;
  onView: (v: PersonView) => void;
  busy: boolean;
  onEquip: (id: string) => void;
  onEquipBest: () => void;
};

export function InkPersonPanel({ state, view, onView, busy, onEquip, onEquipBest }: Props) {
  const [previewGearId, setPreviewGearId] = useState<string | null>(null);
  const c = state.character;
  const nature = ensureNature(c);
  const dominant = dominantNature(c);
  const lover = c.loverId ? state.npcs[c.loverId] : null;
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const stage = getLifeStageLabel(state);
  const gearIds = c.gear ?? [];
  const equipment = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const gearStatTotals = gearTotals(c);
  const gearFxTotals = sumGearCombatBonuses(c);
  const genealogy = buildGenealogy(state);
  const grudges = listGrudges(state);
  const known = listKnownNpcLines(state);

  if (view === 'main') {
    const rows: { id: PersonView; label: string; hint: string }[] = [
      {
        id: 'attrs',
        label: '五維心性',
        hint: `${wuxiaAttributeLabels.genGu}${c.attributes.genGu} · 俠${nature.xia}`,
      },
      {
        id: 'skills',
        label: '武學',
        hint: c.skills.length ? `已習 ${c.skills.length} 門` : '尚未習武',
      },
      {
        id: 'gear',
        label: '裝備',
        hint: `戰意 ${combatPowerScore(c)} · 庫中 ${gearIds.length}`,
      },
      {
        id: 'genealogy',
        label: '族譜',
        hint: `${genealogy.clanLabel} · 第${genealogy.generationIndex}世`,
      },
      {
        id: 'people',
        label: '人際',
        hint: lover
          ? `眷屬 · 子女 ${c.childrenCount ?? 0}`
          : `故人 ${known.length} · 子女 ${c.childrenCount ?? 0}`,
      },
      {
        id: 'grudges',
        label: '恩怨簿',
        hint: grudges.length ? `${grudges.length} 樁未了` : '尚無舊怨',
      },
      {
        id: 'roots',
        label: '江湖根腳',
        hint: `${careerLabel(state)}${getMasterName(state) ? ` · 師「${getMasterName(state)}」` : ''}`,
      },
    ];

    return (
      <section className="ink-panel ink-attrs ink-tab-pane" aria-label="人物">
        <h3>人物</h3>
        <p className="ink-note">
          {c.name} · {c.age}歲 · {stage}
          {lover ? ` · 眷屬${lover.name}` : ''}
        </p>
        <div className="ink-bitlife-list" role="list">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              className="ink-bitlife-row"
              role="listitem"
              onClick={() => {
                onView(row.id);
              }}
            >
              <span className="ink-bitlife-row-text">
                <strong>{row.label}</strong>
                <span>{row.hint}</span>
              </span>
              <span className="ink-bitlife-chevron" aria-hidden>
                ›
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="ink-panel ink-attrs ink-tab-pane" aria-label="人物詳情">
      <button
        type="button"
        className="ink-btn ink-btn--quiet ink-person-back"
        onClick={() => {
          setPreviewGearId(null);
          onView('main');
        }}
      >
        ← 返回人物
      </button>

      {view === 'attrs' && (
        <>
          <h3>五維心性</h3>
          <div className="ink-attr-grid">
            {wuxiaAttributeKeys.map((k) => (
              <div key={k} className="ink-attr">
                <span className="ink-attr-label">{wuxiaAttributeLabels[k]}</span>
                <strong>{c.attributes[k]}</strong>
              </div>
            ))}
          </div>
          <h3 className="ink-subhead">心性</h3>
          <div className="ink-attr-grid">
            {natureKeys.map((k) => (
              <div
                key={k}
                className={`ink-attr ink-nature-card ink-nature--${k}${
                  k === dominant ? ' ink-nature--dominant' : ''
                }`}
              >
                <span className="ink-attr-label">
                  {natureLabels[k]}
                  {k === dominant ? ' · 獨顯' : ''}
                </span>
                <strong>{nature[k]}</strong>
              </div>
            ))}
          </div>
          <p className="ink-note">{natureSummary(c)}</p>
          <p className="ink-note">
            體力 {Math.round(c.stamina ?? 0)}/{c.maxStamina ?? 0} · 閃避約 {playerEvasionPercent(state)}%
          </p>
          <p className="ink-note">
            籍貫 · {c.birthplace || '千燈鎮'} · 所在 {c.location || '千燈鎮'}
          </p>
        </>
      )}

      {view === 'skills' && (
        <>
          <h3>武學</h3>
          {listWeaponMasteries(state).length > 0 && (
            <p className="ink-note">
              兵刃專精 ·{' '}
              {listWeaponMasteries(state)
                .map((m) => `${m.label}${m.level}境`)
                .join(' · ')}
            </p>
          )}
          {c.skills.length === 0 ? (
            <p className="ink-note">尚未習武。</p>
          ) : (
            <ul className="ink-skill-cards">
              {c.skills.map((id) => {
                const def = getSkillDef(id);
                const kind = def?.kind ?? 'external';
                const stance = def?.move ? resolveMoveStance(def.move) : null;
                return (
                  <li key={id} className={`ink-skill-card ink-skill-card--${kind}`}>
                    <div className="ink-skill-card-head">
                      <strong>{skillDisplay(c, id)}</strong>
                      <span className="ink-skill-badge">{skillKindLabel(kind)}</span>
                      {stance ? (
                        <span className={`ink-stance-seal ink-stance-seal--${stance}`}>
                          {MOVE_STANCE_LABEL[stance]}
                        </span>
                      ) : null}
                    </div>
                    {def?.move ? (
                      <p className="ink-skill-move">
                        戰招「{def.move.name}」
                        {stance ? ` · ${MOVE_STANCE_LABEL[stance]}` : ''}
                        {def.move.qiCost > 0 ? ` · 耗內${def.move.qiCost}` : ' · 無耗'}
                        {def.move.power > 0 ? ` · 威×${def.move.power.toFixed(1)}` : ''}
                      </p>
                    ) : null}
                    <p className="ink-skill-fx">{formatSkillEffects(id) || '尚無詳載'}</p>
                  </li>
                );
              })}
            </ul>
          )}
          {formatFragmentProgress(state).length > 0 && (
            <>
              <h3 className="ink-subhead">殘譜</h3>
              <ul className="ink-delta-board ink-playability-board">
                {formatFragmentProgress(state).map((line) => (
                  <li key={line} className="ink-delta-row ink-delta-row--flat">
                    <span className="ink-delta-row-text">{line}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {view === 'gear' && (
        <>
          <h3>裝備</h3>
          <p className="ink-note ink-gear-totals">
            <span className="ink-gear-power">戰意 {combatPowerScore(c)}</span>
            {(() => {
              const bits = summarizeAffixTotals({ ...gearStatTotals, ...gearFxTotals });
              return bits.length ? ` · ${bits.join(' · ')}` : '';
            })()}
          </p>
          <div className="ink-gear-slots" aria-label="已披掛">
            {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
              const id = equipment[slot];
              const def = id ? getGearDef(id) : null;
              const affixes = def ? listGearAffixes(def) : [];
              return (
                <div
                  key={slot}
                  className={`ink-gear-slot${def ? ` ink-gear-slot--${def.rarity}` : ' ink-gear-slot--empty'}`}
                >
                  <span className="ink-gear-slot-label">{SLOT_LABEL[slot]}</span>
                  {def ? (
                    <>
                      <strong className={`ink-gear-name ink-rarity-${def.rarity}`}>
                        {displayGearName(def)}
                      </strong>
                      <span className="ink-gear-meta">
                        {RARITY_SHORT[def.rarity]}
                        {def.weaponKind ? ` · ${WEAPON_KIND_LABEL[def.weaponKind]}` : ''}
                      </span>
                      <ul className="ink-affix-list ink-affix-list--compact">
                        {affixes.slice(0, 3).map((line) => (
                          <li key={`${line.tier}-${line.text}`} className={`ink-affix ink-affix--${line.tier}`}>
                            {formatAffixDisplay(line)}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <span className="ink-gear-empty">空</span>
                  )}
                </div>
              );
            })}
          </div>
          {gearIds.length === 0 ? (
            <p className="ink-note">行囊尚空。</p>
          ) : (
            <ul className="ink-gear-cards">
              {gearIds.map((id) => {
                const def = getGearDef(id);
                if (!def) return null;
                const equipped = equipment[def.slot] === id;
                const preview = previewGearId === id ? previewEquipDelta(c, id) : null;
                const affixes = listGearAffixes(def);
                return (
                  <li
                    key={id}
                    className={`ink-gear-card ink-gear-card--${def.rarity}${equipped ? ' ink-gear-card--on' : ''}`}
                  >
                    <div className="ink-gear-card-head">
                      <strong className={`ink-gear-name ink-rarity-${def.rarity}`}>
                        {displayGearName(def)}
                      </strong>
                      <span className={`ink-rarity-tag ink-rarity-${def.rarity}`}>
                        {RARITY_SHORT[def.rarity]}
                      </span>
                      {equipped ? <span className="ink-gear-on-tag">披中</span> : null}
                    </div>
                    <p className="ink-gear-meta">
                      {gearTitleBits(def)} · {SLOT_LABEL[def.slot]}
                    </p>
                    <ul className="ink-affix-list">
                      {affixes.map((line) => (
                        <li
                          key={`${line.tier}-${line.name ?? ''}-${line.text}`}
                          className={`ink-affix ink-affix--${line.tier}`}
                        >
                          {formatAffixDisplay(line)}
                        </li>
                      ))}
                    </ul>
                    <p className="ink-gear-desc">{def.description}</p>
                    <div className="ink-gear-actions">
                      {!equipped && (
                        <button
                          type="button"
                          className="ink-btn ink-btn--quiet"
                          disabled={busy}
                          onClick={() => {
                            setPreviewGearId(previewGearId === id ? null : id);
                          }}
                        >
                          {previewGearId === id ? '收起' : '對比'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="ink-btn ink-btn--quiet"
                        disabled={busy || equipped}
                        onClick={() => {
                          setPreviewGearId(null);
                          onEquip(id);
                        }}
                      >
                        {equipped ? '披中' : '披上'}
                      </button>
                    </div>
                    {preview && !preview.alreadyEquipped && (
                      <p
                        className={`ink-gear-preview${
                          preview.powerDelta >= 0 ? ' ink-gear-preview--up' : ' ink-gear-preview--down'
                        }`}
                      >
                        若披上：{preview.summary}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className="ink-btn ink-btn--quiet" disabled={busy} onClick={onEquipBest}>
            整裝披掛
          </button>
        </>
      )}

      {view === 'genealogy' && (
        <>
          <h3>族譜</h3>
          <div className="ink-genealogy" aria-label={`族譜·${genealogy.clanLabel}`}>
            <p className="ink-genealogy-head">
              {genealogy.clanLabel} · 第{genealogy.generationIndex}世
            </p>
            <ul className="ink-genealogy-list">
              {genealogy.entries.map((e, i) => {
                const prev = genealogy.entries[i - 1];
                const showGen = !prev || prev.generation !== e.generation;
                return (
                  <li
                    key={`${e.generation}-${e.title}-${e.name}-${i}`}
                    className={`ink-genealogy-row${e.self ? ' ink-genealogy-row--self' : ''}${
                      e.heir ? ' ink-genealogy-row--heir' : ''
                    }`}
                  >
                    {showGen ? (
                      <span className="ink-genealogy-gen">{e.generation}</span>
                    ) : (
                      <span className="ink-genealogy-gen ink-genealogy-gen--gap" aria-hidden />
                    )}
                    <span className="ink-genealogy-title">{e.title}</span>
                    <strong className="ink-genealogy-name">{e.name}</strong>
                    {e.note ? <span className="ink-genealogy-note">{e.note}</span> : null}
                  </li>
                );
              })}
            </ul>
            {genealogy.chronicle.length > 0 && (
              <>
                <p className="ink-genealogy-sub">跨世殘頁</p>
                <ul className="ink-genealogy-chronicle">
                  {genealogy.chronicle.slice(-6).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      {view === 'people' && (
        <>
          <h3>人際</h3>
          {lover ? <p className="ink-note">眷屬 · {lover.name}</p> : <p className="ink-note">尚未有眷屬。</p>}
          <p className="ink-note">
            子女 · {c.childrenCount ?? 0}
            {listChildNames(state).length ? `（${listChildNames(state).join('、')}）` : ''}
            {getHeirName(state) ? ` · 嗣「${getHeirName(state)}」` : ''}
          </p>
          {(c.childrenCount ?? 0) > 0 && (
            <p className="ink-note">死後可繼族產約 {previewInheritanceMoney(state)} 兩</p>
          )}
          {c.loverId && (c.childrenCount ?? 0) === 0 && (
            <p className="ink-note">已有眷屬——可至修行「求子添丁」。</p>
          )}
          <h3 className="ink-subhead">鎮中故人</h3>
          {known.length === 0 ? (
            <p className="ink-note">尚未結識江湖人物。</p>
          ) : (
            known.map((line) => (
              <p key={line} className="ink-note">
                {line}
              </p>
            ))
          )}
        </>
      )}

      {view === 'grudges' && (
        <>
          <h3>恩怨簿</h3>
          {grudges.length === 0 ? (
            <p className="ink-note">尚無記入簿中的舊怨人情。</p>
          ) : (
            <ul className="ink-delta-board ink-playability-board">
              {grudges.map((g) => (
                <li
                  key={g.id}
                  className={`ink-delta-row ink-delta-row--${
                    g.kind === 'favor' ? 'up' : g.kind === 'blood' ? 'down' : 'flat'
                  }`}
                >
                  <span className="ink-delta-row-text">
                    {grudgeKindLabel(g.kind)} · {g.name}
                    （深{g.strength} · 餘{g.monthsLeft}月）
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {view === 'roots' && (
        <>
          <h3>江湖根腳</h3>
          <p className="ink-note">
            行當 · {careerLabel(state)}
            {getCareer(state) ? `（月利約${getCareer(state)!.income}兩）` : ''}
          </p>
          <p className="ink-note">
            {getMasterName(state)
              ? `業師「${getMasterName(state)}」${c.flags.master_severed ? '（已斷）' : ''}`
              : '尚未拜師'}
            {c.flags.lover_dual_done ? ' · 俠侶相守' : ''}
            {c.flags.lover_severed ? ' · 舊情已斷' : ''}
          </p>
          {sect ? <p className="ink-note">門派 · {sect.name}</p> : <p className="ink-note">尚未入派</p>}
          {listWeaponMasteries(state).length > 0 && (
            <p className="ink-note">
              兵刃專精 ·{' '}
              {listWeaponMasteries(state)
                .map((m) => `${m.label}${m.level}境`)
                .join(' · ')}
            </p>
          )}
          {formatFragmentProgress(state).length > 0 && (
            <>
              <h3 className="ink-subhead">殘譜進度</h3>
              <ul className="ink-delta-board ink-playability-board">
                {formatFragmentProgress(state).map((line) => (
                  <li key={line} className="ink-delta-row ink-delta-row--flat">
                    <span className="ink-delta-row-text">{line}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
