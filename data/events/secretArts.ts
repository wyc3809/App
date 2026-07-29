import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

/** 參考「奇遇學武」風格（原創招式名，非現代 IP） */
const RAW: GameEvent[] = [
  {
    id: 'secret_cave_manual',
    title: '石壁殘篇',
    body: '山腹石壁刻著模糊掌譜，旁有枯骨與半截火折子。',
    tags: ['special', 'martial', 'secret'],
    weight: 8,
    requirements: { minAge: 16, once: true, maxNature: { e: 55 } },
    choices: [
      {
        id: 'study',
        text: '摹下掌譜苦練',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_stone_palm', name: '裂石殘掌' },
              { type: 'martial', amount: 12 },
              { type: 'maxQi', amount: 20 },
              { type: 'narrate', text: '你借着半截火折子的光，一筆筆摹下石壁掌譜。枯骨無言，掌影卻在心口反覆敲打。練到第三遍時，內息忽然一振——裂石之意已入筋骨，洞外風聲也像遠了。' },
            ],
          },
        ],
      },
      {
        id: 'copy',
        text: '只抄錄帶走',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 4 },
              { type: 'narrate', text: '洞裡陰氣太重，你不敢貪功。匆匆把殘篇拓下，收入懷中退出山腹。日光刺眼的一瞬，你知道這份掌譜還要日後慢慢拆，至少今夜活着走出來了。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '怕有詭異，退去',
        outcomes: [{ effects: [{ type: 'narrate', text: '你總覺得石壁後還有未醒之物，於是轉身退出。洞口風聲嗚咽，像有人在暗處哭泣。你沒有回頭，把詭異留在山腹，把性命留在路上。' }] }],
      },
    ],
  },
  {
    id: 'secret_rain_master',
    title: '雨夜傳功',
    body: '一名青衣老者在橋上避雨，見你根骨尚可，願點撥三招。',
    tags: ['special', 'martial', 'secret'],
    weight: 7,
    requirements: { minAge: 16, minAttrs: { wuXing: 40 }, minNature: { xia: 10 }, maxNature: { e: 50 } },
    choices: [
      {
        id: 'accept',
        text: 'None',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_bridge_step', name: '斷橋步' },
              { type: 'martial', amount: 10 },
              { type: 'maxHealth', amount: 15 },
              { type: 'narrate', text: '雨打石橋，老者只點你三處破綻，又教你三步身法。你依言演過，衣袖已濕透。抬頭再找時，青衣人影已沒入雨幕，只餘橋下水聲——斷橋之步，卻留在了你腿上。' },
            ],
          },
        ],
      },
      {
        id: 'ask_more',
        text: '追問來歷',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 3 },
              { type: 'narrate', text: '你追問來歷，老者只笑，袖中拋出一句「莫問前程」。雨更大了，他轉身便走。你沒討到身世，卻把那一笑記得很清楚：江湖人，往往只傳功夫，不傳姓名。' },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        text: '婉言謝絕',
        outcomes: [{ effects: [{ type: 'narrate', text: '你婉言謝絕，拱手退去。老者也不勉強，只把斗笠壓低。雨聲忽然更大，像替這段未成的師徒緣蓋上章印。你走下橋時，心裡竟有一絲空落。' }] }],
      },
    ],
  },
  {
    id: 'secret_tomb_blade',
    title: '古墓劍塚',
    body: '塌陷的墓道中，一柄無銘長劍插於石台，隱有龍吟。',
    tags: ['special', 'martial', 'secret', 'gear'],
    weight: 5,
    requirements: { minAge: 18, minAttrs: { danShi: 45 }, once: true, minNature: { kuang: 12 } },
    choices: [
      {
        id: 'draw',
        text: '拔劍試鋒',
        outcomes: [
          {
            effects: [
              { type: 'grantGear', gearId: 'divine-xuan-sword' },
              { type: 'learnSkill', skillId: 'art_tomb_sword', name: '無銘劍意' },
              { type: 'martial', amount: 15 },
              { type: 'narrate', text: '你握住無銘劍脊，用力一拔。劍鳴如龍吟，墓道塵土竟退開半尺。劍意無形，卻在腕底生出寒意——神兵在握的同時，你也感覺到：這柄劍要的不是主人，是敢試鋒的人。' },
            ],
          },
        ],
      },
      {
        id: 'worship',
        text: '上香致敬，不妄取',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { fuYuan: 3 } },
              { type: 'maxQi', amount: 10 },
              { type: 'narrate', text: '你上香三炷，不敢妄取。石台前靜坐片刻，劍意如潮卻不近身。出墓時兩手空空，福緣卻似被地下之物點了一下——有時不拿，才是真正拿住了。' },
            ],
          },
        ],
      },
      {
        id: 'seal',
        text: '重新封土離開',
        outcomes: [{ effects: [{ type: 'narrate', text: '你重新封土，把墓道隱回山壁。手掌沾泥，心卻定了：有些東西沉在地下更好。江湖路上，不是每柄劍都該出鞘。' }] }],
      },
    ],
  },
  {
    id: 'secret_lake_breath',
    title: '湖心寒息',
    body: '冬湖結薄冰，湖心氣機異動，似有人在冰下運功。',
    tags: ['special', 'martial', 'secret'],
    weight: 6,
    requirements: { minAge: 17, maxNature: { e: 48 } },
    choices: [
      {
        id: 'meditate',
        text: '在岸邊對息',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_lake_breath', name: '寒湖吐納' },
              { type: 'maxQi', amount: 35 },
              { type: 'qi', amount: 40 },
              { type: 'narrate', text: '你在岸邊對着湖心吐納。薄冰下似有氣息起伏，寒意沿奇經緩緩遊走。不知過了多久，一縷冰涼卻清明的內息貫穿丹田——寒湖吐納，就此落子。' },
            ],
          },
        ],
      },
      {
        id: 'dive',
        text: '破冰探查',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -20 },
              { type: 'martial', amount: 6 },
              { type: 'narrate', text: '你破冰探入，湖水刺骨如刀。深處幽暗，只撈到一塊刻字玉佩，字跡已被水蝕。上岸時牙齒打顫，武意卻因這場硬闖多了幾分狠勁。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '恐有蹊蹺，離去',
        outcomes: [{ effects: [{ type: 'narrate', text: '你總覺得湖心不似善地，遠遠看了一眼便轉身回鎮。冬風刮面，平安比奇遇更值錢——至少此刻如此。' }] }],
      },
    ],
  },
  {
    id: 'secret_beggar_scroll',
    title: '丐者殘卷',
    body: '城門口一老丐把一卷油污帛書塞進你懷裡，口中只道「有緣人」，隨即消失於人潮。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 9,
    requirements: { minAge: 16, once: true, minNature: { xie: 8 }, maxNature: { xia: 70 } },
    choices: [
      {
        id: 'study',
        text: '展卷細讀',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_silk_hand', name: '柔絲手' },
              { type: 'martial', amount: 8 },
              { type: 'narrate', text: '你在客棧展開油污帛書。字跡歪斜，卻句句是化力卸勁的門道。讀到夜半，手指不自覺在桌沿比劃——柔絲手的影子，已悄悄纏上你的關節。' },
            ],
          },
        ],
      },
      {
        id: 'sell',
        text: '拿到市集問價',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 25 },
              { type: 'narrate', text: '你拿到市集問價，書商嗅了嗅，只當舊物，給了一筆小錢。帛書易主的一瞬，你說不清是鬆了口氣，還是丟了機緣。銀兩入袋，心事卻還在。' },
            ],
          },
        ],
      },
      {
        id: 'burn',
        text: '恐是禍端，付之一炬',
        outcomes: [{ effects: [{ type: 'narrate', text: '你怕這殘卷是禍端，一火焚之。火光一閃，紙灰隨風散盡。有人會說可惜，你只覺得夜色忽然乾淨了些。' }] }],
      },
    ],
  },
  {
    id: 'secret_cliff_shadow',
    title: '斷崖影拳',
    body: '暮色中斷崖上有人影獨自打拳，拳影映在岩壁，竟像是三重身法疊加。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 8,
    requirements: { minAge: 16, minAttrs: { wuXing: 35 }, minNature: { kuang: 10 } },
    choices: [
      {
        id: 'imitate',
        text: '在暗處摹拳',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_nine_shadow', name: '九影迷踪步' },
              { type: 'martial', amount: 11 },
              { type: 'narrate', text: '你藏在崖側暗處，把影中人的步位一寸寸記下。暮色收盡時，拳影散了，你自己演過半套，發覺身法輕了半寸——九影迷踪，原來是從影子裡偷來的路。' },
            ],
          },
        ],
      },
      {
        id: 'greet',
        text: '上前請教',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 2 },
              { type: 'martial', amount: 4 },
              { type: 'narrate', text: '你上前請教，影中人停拳，只伸手點你肩線一處，便轉身沒入林影。不肯多言，卻已把要害說完。你揉着肩膀下山，名望與悟處都多了一點。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不便打擾，悄然退去',
        outcomes: [{ effects: [{ type: 'narrate', text: '你不便打擾，悄然退去。崖上拳影仍在，你把那餘影收進心裡，轉身下山——有些功夫，看過一遍也算見過世面。' }] }],
      },
    ],
  },
  {
    id: 'secret_temple_bell',
    title: '古寺鐘鳴',
    body: '荒寺鐘聲無故自鳴，梁上落下半頁拳譜，字跡被香火熏得發黃。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 7,
    requirements: { minAge: 17, once: true, minNature: { xia: 14 }, maxNature: { e: 40 } },
    choices: [
      {
        id: 'take',
        text: '收下拳譜苦練',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_thunder_blade', name: '驚雷刀' },
              { type: 'martial', amount: 10 },
              { type: 'grantGear', gearId: 'iron-blade' },
              { type: 'narrate', text: '你收下梁上拳譜，回房苦練。譜中刀意如雷，越打越覺得腕底生風；連同寺中那柄鐵刀，也像突然有了脾氣。鐘聲再響時，你已不是空手進寺的人。' },
            ],
          },
        ],
      },
      {
        id: 'pray',
        text: '重新供上，只求心安',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 15 },
              { type: 'attr', delta: { fuYuan: 2 } },
              { type: 'narrate', text: '你把拳譜重新供上，只求心安。鐘聲再響一記，梁塵微落，你內息竟平穩許多。福緣這種東西，有時不是搶來的，是放回去的。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不敢久留，離寺',
        outcomes: [{ effects: [{ type: 'narrate', text: '你不敢久留，退出山門。回望荒寺，鐘聲已止，連香火味都淡了。山路上只有你的腳步——有些奇遇，適可而止才走得遠。' }] }],
      },
    ],
  },
  {
    id: 'secret_snow_hermit',
    title: '雪夜隱士',
    body: '大雪封路，茅屋中一白髮隱士正在煮雪，見你凍僵，邀你入內取暖，順便點破你吐納之滯。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 8,
    requirements: { minAge: 16, maxNature: { e: 45 } },
    choices: [
      {
        id: 'learn',
        text: '恭敬求教吐納',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_void_breath', name: '空冥吐納' },
              { type: 'maxQi', amount: 30 },
              { type: 'qi', amount: 35 },
              { type: 'narrate', text: '雪夜茅屋，隱士煮雪點茶，又指點你吐納滯處。只教半炷香，你已覺丹田溫熱，空冥之息如雪融入脈。門外大雪仍封路，屋內卻像另有春天。' },
            ],
          },
        ],
      },
      {
        id: 'chat',
        text: '只敘家常，不談武學',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 20 },
              { type: 'attr', delta: { meiLi: 2 } },
              { type: 'narrate', text: '你不談武學，只與隱士敘些家常。一碗熱湯入腹，凍僵的手指回了血色。有時候，活着走完雪路，比多學一招更要緊。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '道謝後繼續趕路',
        outcomes: [{ effects: [{ type: 'narrate', text: '你道謝後繼續趕路。回頭看時，茅屋已被大雪吞沒，像從未存在。雪地上只留你一行腳印——遇見過，便不算空走。' }] }],
      },
    ],
  },
  {
    id: 'secret_market_duel',
    title: '市井約戰',
    body: '茶棚裡有人出言譏諷你武學花俏，當眾約你比試三招，圍觀者越來越多。',
    tags: ['special', 'combat', 'secret', 'qiuyu'],
    weight: 10,
    requirements: { minAge: 16, minMartial: 10, minNature: { kuang: 12 } },
    choices: [
      {
        id: 'accept',
        text: '應戰比試',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '你應下比試，茶棚外人群讓出空地。譏諷你的人搓拳上場，圍觀者起哄。刀光未出，風先緊了——這一局，要用真功夫說話。' },
              { type: 'martial', amount: 2 },
            ],
          },
        ],
      },
      {
        id: 'humble',
        text: '以禮化解',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 3 },
              { type: 'narrate', text: '你拱手認弱，把場面讓下去。對方愣了愣，反倒不好意思，雙方罷手。圍觀者有人失望，也有人點頭：能收能放，也是一種厲害。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不與爭鋒，離席',
        outcomes: [{ effects: [{ type: 'narrate', text: '你不與爭鋒，放下茶錢離席。背後有嗤笑傳來，你當作風聲。面子薄了半分，麻煩卻少了一場——今日的路，你還想走遠些。' }, { type: 'reputation', amount: -1 }] }],
      },
    ],
  },
  {
    id: 'secret_night_thief',
    title: '夜半盜譜',
    body: '客棧窗外黑影一閃，似有人欲偷你枕下的殘譜。',
    tags: ['special', 'combat', 'secret', 'qiuyu'],
    weight: 7,
    requirements: { minAge: 16, minNature: { xie: 10 }, maxNature: { xia: 65 } },
    choices: [
      {
        id: 'chase',
        text: '追出夜巷',
        outcomes: [{ effects: [{ type: 'narrate', text: '你提氣追出客棧，夜巷狹長，黑影折轉。刀光忽然一閃，逼得你不得不應——盜譜之人不只會跑，還會動手。' }] }],
      },
      {
        id: 'trap',
        text: '假裝入睡，伺機反制',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 15 },
              { type: 'martial', amount: 3 },
              { type: 'narrate', text: '你假裝入睡，呼吸放緩。黑影伸手的一瞬，你反扣其腕。對方吃痛，丟下一袋碎銀便逃。殘譜仍在枕下，夜色裡你聽見自己的心跳。' },
            ],
          },
        ],
      },
      {
        id: 'yell',
        text: '大喊有賊',
        outcomes: [{ effects: [{ type: 'narrate', text: '你大喊有賊，客棧立刻喧鬧起來。燈火亂晃，黑影早已無踪。譜還在，人已散——有時候喊一聲，比追一程更管用。' }] }],
      },
    ],
  },
];

export const SECRET_ART_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    (_id, text = '此舉') => [
      {
        type: 'narrate',
        text: `奇遇之中你欲「${text}」，卻踏空一步：暗勁反噬，內息紊亂。事與願違之後，你扶牆站穩，把這場驚險記進傷口。`,
      },
      { type: 'health', amount: -18 },
      { type: 'condition', id: 'internal' },
    ],
    0.16,
  ),
);
