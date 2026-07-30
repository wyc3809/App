import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

/**
 * 可重複的路遇交手（無 once）：配合 combatEncounterCountdown，約 7–15 月遇敵一次。
 */
const RAW: GameEvent[] = [
  {
    id: 'road_bandit_pass',
    title: '剪徑劫匪',
    body: '山道狹處忽然閃出數人，刀光一顫：「買路錢，少一文打斷腿。」',
    tags: ['ordinary', 'combat', 'road'],
    weight: 14,
    requirements: { minAge: 15 },
    choices: [
      {
        id: 'fight',
        text: '拔刀硬闖',
        outcomes: [{ effects: [{ type: 'narrate', text: '刀來刀往，這一局要用真功夫說話。' }] }],
      },
      {
        id: 'pay',
        text: '丟銀過關',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -14 },
              { type: 'health', amount: 2 },
              { type: 'narrate', text: '你拋出銀子。匪徒讓路，你捏緊刀柄走過——保命有時也是本事。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '抽身繞道',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { danShi: 1 } },
              { type: 'reputation', amount: -1 },
              { type: 'narrate', text: '你退回岔路，沿獸徑翻過山脊。多走半日，避開一場惡戰。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'road_drunk_challenge',
    title: '醉漢叫陣',
    body: '酒肆外一名醉漢以桌為擂，指名要與過路人「論三招」，圍觀者起哄。',
    tags: ['ordinary', 'combat', 'road'],
    weight: 12,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'fight',
        text: '上台應戰',
        outcomes: [{ effects: [{ type: 'narrate', text: '你捲袖上台。醉拳不醉力，這一交手容不得輕敵。' }] }],
      },
      {
        id: 'talk',
        text: '好言勸醒',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 2 },
              { type: 'nature', delta: { xia: 1 } },
              { type: 'money', amount: -4 },
              { type: 'narrate', text: '你請他喝茶醒酒。有人笑你軟，也有人點頭——至少今夜沒人見血。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '默默離去',
        outcomes: [
          {
            effects: [
              { type: 'world', delta: { rumors: 1 } },
              { type: 'narrate', text: '你不當這個出頭鳥。背後起哄聲漸漸遠了。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'road_masked_ambush',
    title: '林蔭伏擊',
    body: '林蔭道上一聲唿哨，蒙面人自樹後落下，短刃指着你的包裹。',
    tags: ['ordinary', 'combat', 'road'],
    weight: 13,
    requirements: { minAge: 15 },
    choices: [
      {
        id: 'fight',
        text: '反手迎擊',
        outcomes: [{ effects: [{ type: 'narrate', text: '你卸開第一刺，戰場瞬間縮成三尺泥地。' }] }],
      },
      {
        id: 'throw',
        text: '拋出銀包誘敵',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -10 },
              { type: 'martial', amount: 1 },
              { type: 'attr', delta: { danShi: 1 } },
              { type: 'narrate', text: '銀包落地，對方眼神一亂——你趁隙脫身，記下他們的記號。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '借樹影抽身',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -3 },
              { type: 'nature', delta: { xie: 1 } },
              { type: 'narrate', text: '你滾進灌木叢，荆棘刮破衣袖。人逃掉了，顏面暫時顧不上。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'road_escort_raid',
    title: '鏢旗告急',
    body: '前方鏢車被圍，鏢師染血仍在支撐，喊你：「義士！幫忙！」',
    tags: ['ordinary', 'combat', 'road'],
    weight: 11,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'fight',
        text: '拔刃相助',
        outcomes: [{ effects: [{ type: 'narrate', text: '你衝入包圍圈。刀光與鏢旗攪在一處。' }] }],
      },
      {
        id: 'distract',
        text: '高聲驚擾',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 2 },
              { type: 'nature', delta: { xia: 2 } },
              { type: 'money', amount: 6 },
              { type: 'narrate', text: '你喊來附近腳夫與獵戶。匪徒忌憚人多，略退——鏢師塞你一包謝銀。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '自顧離開',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xia: -1 } },
              { type: 'world', delta: { danger: 1 } },
              { type: 'narrate', text: '你低頭快步走過。身後喊殺聲刺耳，你告訴自己：不是每次都能救人。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'road_rival_spar',
    title: '道上切磋',
    body: '一名同道擋路拱手：「久聞大名，請賜教三招。點到即止。」眼神卻不像玩笑。',
    tags: ['ordinary', 'combat', 'road'],
    weight: 12,
    requirements: { minAge: 16, minMartial: 8 },
    choices: [
      {
        id: 'fight',
        text: '痛快過招',
        outcomes: [{ effects: [{ type: 'narrate', text: '你還禮拔刃。比試一開，力道卻比「點到即止」重得多。' }] }],
      },
      {
        id: 'decline_politely',
        text: '以禮婉拒',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 1 },
              { type: 'attr', delta: { meiLi: 1 } },
              { type: 'narrate', text: '你說近日內息未穩，改日再領教。對方哼一聲讓路，臨走丟下一句「怕了便直說」。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '轉身就走',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: -2 },
              { type: 'nature', delta: { kuang: -1 } },
              { type: 'narrate', text: '你不戀戰，直接離開。背後嗤笑聲跟着走了半里路。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'road_night_stalker',
    title: '夜路尾隨',
    body: '夜路燈少，你總覺得身後有腳步合着你的節奏。回頭時，黑影倏地逼近。',
    tags: ['ordinary', 'combat', 'road'],
    weight: 12,
    requirements: { minAge: 15 },
    choices: [
      {
        id: 'fight',
        text: '先發制人',
        outcomes: [{ effects: [{ type: 'narrate', text: '你反身出招。暗處人影不得不亮出兵刃。' }] }],
      },
      {
        id: 'lantern',
        text: '舉火逼問',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 1 },
              { type: 'world', delta: { rumors: 2 } },
              { type: 'money', amount: -3 },
              { type: 'narrate', text: '火光一晃，對方退半步，丟下一句「認錯人了」便沒入巷底。你記住了那副嗓音。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '奔入人煙',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 2 },
              { type: 'attr', delta: { fuYuan: 1 } },
              { type: 'narrate', text: '你衝向燈火通明的巷口。尾隨聲停了——有時，人多就是最好的兵刃。' },
            ],
          },
        ],
      },
    ],
  },
];

function badStory(_id: string, text?: string): string {
  const act = text ?? '此舉';
  return `你本欲「${act}」，卻在交手邊緣失了先機：人或走避，事或橫生。你帶着挫敗感離開。`;
}

export const ROAD_ENCOUNTER_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    (id, text) => [
      { type: 'narrate', text: badStory(id, text) },
      { type: 'health', amount: -10 },
      { type: 'money', amount: -5 },
    ],
    0.2,
  ),
);
