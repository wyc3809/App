import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

/**
 * 金庸書卷 tropes（可辨識橋段，文言手寫敘事）
 * special → 奇遇池；其餘 → 翻頁日常池
 */
const RAW: GameEvent[] = [
  {
    id: 'jy_snake_blood',
    title: '蛇谷飲血',
    body: '谷中巨蛇盤石，血氣腥甜。老人說：飲其血可通經脈，亦可能毒發暴斃。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 7,
    requirements: { minAge: 16, once: true, minAttrs: { genGu: 35 } },
    choices: [
      {
        id: 'drink',
        text: '咬牙飲下蛇血',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 28 },
              { type: 'qi', amount: 40 },
              { type: 'martial', amount: 10 },
              { type: 'attr', delta: { genGu: 3 } },
              { type: 'health', amount: -18 },
              { type: 'condition', id: 'poison' },
              { type: 'flag', key: 'jy_snake_blood', value: true },
              {
                type: 'narrate',
                text: '蛇血入喉如火。你跪地嘔吐，又強行把那股熱逼進經脈。三日後毒焰漸退，丹田卻多了一汪沉沉的力——旁人說你眼底多了點陰冷的光。',
              },
            ],
          },
        ],
      },
      {
        id: 'dab',
        text: '只以蛇血擦傷口',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 10 },
              { type: 'martial', amount: 4 },
              { type: 'health', amount: -6 },
              {
                type: 'narrate',
                text: '你不敢狂飲，只把蛇血抹在舊傷上。皮肉燒得發紫，卻也硬生生封了口。內息略厚，遠不及傳說那般翻天。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '怕毒入骨，退去',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你看著蛇瞳裡自己的影子，終究退了。谷風一過，腥氣散去——有些便宜，命不夠長便拿不到。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_cliff_cave',
    title: '絕壁殘譜',
    body: '山道坍塌，你墜落崖縫，竟見石壁刻滿拳腳圖形，旁有枯坐白骨。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 6,
    requirements: { minAge: 15, once: true },
    choices: [
      {
        id: 'study',
        text: '借洞中餘糧苦摹',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'jy_cliff_fist', name: '絕壁殘拳' },
              { type: 'martial', amount: 14 },
              { type: 'maxHealth', amount: 12 },
              { type: 'attr', delta: { wuXing: 2 } },
              { type: 'flag', key: 'jy_cliff_cave', value: true },
              {
                type: 'narrate',
                text: '白骨無言，石圖卻活。你摹到指裂，才摸着藤蔓爬出。崖上風大，你一招一式卻穩了——像把整座山背在身上。',
              },
            ],
          },
        ],
      },
      {
        id: 'rubbing',
        text: '匆匆拓印便走',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 5 },
              { type: 'money', amount: 8 },
              {
                type: 'narrate',
                text: '洞陰太重，你只拓了半幅圖便攀出去。紙上墨跡未乾，日後慢慢拆——至少這次沒把命留在崖底。',
              },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '怕有機關，急退',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -8 },
              {
                type: 'narrate',
                text: '你疑心白骨是前人警戒，連滾帶爬逃出縫隙。膝蓋破了，心却定了：有些譜，不是這一世的。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_cold_pool',
    title: '寒潭吐納',
    body: '山後寒潭終年不凍不溫，潭邊石床涼如積雪。有人說在此調息可清火毒。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 6,
    requirements: { minAge: 17, once: true, minAttrs: { wuXing: 30 } },
    choices: [
      {
        id: 'soak',
        text: '入潭運功七七四十九日',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 22 },
              { type: 'qi', amount: 35 },
              { type: 'martial', amount: 8 },
              { type: 'attr', delta: { genGu: 2, wuXing: 1 } },
              { type: 'health', amount: -10 },
              { type: 'flag', key: 'jy_cold_pool', value: true },
              {
                type: 'narrate',
                text: '寒意刺骨，你牙關打顫仍把息壓入丹田。出潭那天，呵出的氣白得像雪——內息清了，人也瘦了一圈。',
              },
            ],
          },
        ],
      },
      {
        id: 'short',
        text: '只坐石床一晝夜',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 8 },
              { type: 'qi', amount: 15 },
              { type: 'martial', amount: 3 },
              {
                type: 'narrate',
                text: '石床冰得你睡不着，卻也逼得心猿安靜。天明起身，火氣退了半分，算是小補。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '怕寒傷身，離去',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你摸了摸潭水，縮回手。寒潭還在，機緣便讓給下一個不怕冷的人。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_ancient_tomb',
    title: '古墓寒玉',
    body: '墓道盡頭一床寒玉，旁有女聲殘響似的風。石匣裡壓着薄薄一冊。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 5,
    requirements: { minAge: 18, once: true, maxNature: { e: 60 } },
    choices: [
      {
        id: 'read',
        text: '臥寒玉讀冊',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'jy_tomb_step', name: '墓中步' },
              { type: 'martial', amount: 12 },
              { type: 'maxQi', amount: 16 },
              { type: 'attr', delta: { danShi: 2 } },
              { type: 'flag', key: 'jy_ancient_tomb', value: true },
              {
                type: 'narrate',
                text: '寒玉滲進脊骨，冊上字卻越看越熱。你練到腳步無聲，墓燈才滅——出墓時，陽光刺眼，像另一個世界。',
              },
            ],
          },
        ],
      },
      {
        id: 'take_box',
        text: '只取石匣便走',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 40 },
              { type: 'martial', amount: 3 },
              {
                type: 'narrate',
                text: '你不敢久留，抱匣而出。匣中並非金銀，是半卷圖譜與一枚舊玉——賣得了錢，也賣不掉那陣寒意。',
              },
            ],
          },
        ],
      },
      {
        id: 'seal',
        text: '原樣封回',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xia: 1 } },
              {
                type: 'narrate',
                text: '你把冊子壓回原處，退出墓道。有些東西屬於長眠的人；你把敬意留下，把命帶走。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_nine_yin_scraps',
    title: '玄陰殘頁',
    body: '破廟香灰裡夾着幾頁帛書，字跡顛倒難辨，隱有「玄陰」二字。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 5,
    requirements: { minAge: 18, once: true, minAttrs: { wuXing: 45 } },
    choices: [
      {
        id: 'decipher',
        text: '顛倒讀之，硬練',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'jy_xuan_yin', name: '玄陰殘式' },
              { type: 'martial', amount: 16 },
              { type: 'maxQi', amount: 18 },
              { type: 'health', amount: -14 },
              { type: 'condition', id: 'internal' },
              { type: 'flag', key: 'jy_nine_yin', value: true },
              {
                type: 'narrate',
                text: '你把帛書倒着讀，經脈逆走得眼前發黑。撐過那一關，指尖竟生涼意——功成一半，人卻像被掏空過。',
              },
            ],
          },
        ],
      },
      {
        id: 'sell',
        text: '賣給識貨人',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 70 },
              { type: 'reputation', amount: -2 },
              {
                type: 'narrate',
                text: '書商接過帛書，眼睛亮了一下，銀子卻給得很爽快。你口袋沉了，夜裡却總夢見有人在廟裡哭。',
              },
            ],
          },
        ],
      },
      {
        id: 'burn',
        text: '怕惹禍，付之一炬',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xia: 1 } },
              {
                type: 'narrate',
                text: '火舌捲走帛書。灰裡再無「玄陰」。你鬆了口氣，也像丟了一扇不該開的門。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_nine_yang',
    title: '純陽殘息',
    body: '谷底温泉汽霧裡，石壁有人用指寫下「純陽」二字，旁有坐化老僧。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 5,
    requirements: { minAge: 18, once: true, minNature: { xia: 8 }, maxNature: { e: 45 } },
    choices: [
      {
        id: 'breathe',
        text: '依壁吐納',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'jy_chun_yang', name: '純陽殘息' },
              { type: 'maxQi', amount: 24 },
              { type: 'maxHealth', amount: 18 },
              { type: 'martial', amount: 11 },
              { type: 'health', amount: 10 },
              { type: 'flag', key: 'jy_nine_yang', value: true },
              {
                type: 'narrate',
                text: '温泉熱氣與石壁涼意同時進體。你睜眼時，舊傷竟暖了——像有人把太陽塞進了你胸口。',
              },
            ],
          },
        ],
      },
      {
        id: 'bury',
        text: '先葬老僧，再學',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 6 },
              { type: 'maxQi', amount: 10 },
              { type: 'nature', delta: { xia: 2 } },
              { type: 'reputation', amount: 3 },
              {
                type: 'narrate',
                text: '你堆石為墳，再對壁吐納。功法只得皮毛，心裡却踏實：先做人，再習武。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不敢貪功，退去',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你對老僧合十，退出谷口。温泉聲遠遠跟上來，像一句沒說完的叮囑。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_toad_pool',
    title: '蟾池奇功',
    body: '荒池多蟾，石碑歪斜寫着「以毒攻毒」。池心沉着半塊鐵牌。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 4,
    requirements: { minAge: 17, once: true, minNature: { xie: 5 } },
    choices: [
      {
        id: 'train',
        text: '按碑文硬練蛤蟆式',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'jy_toad_art', name: '蟾池功' },
              { type: 'martial', amount: 13 },
              { type: 'maxQi', amount: 12 },
              { type: 'attr', delta: { genGu: 2 } },
              { type: 'nature', delta: { xie: 2, kuang: 1 } },
              { type: 'condition', id: 'poison' },
              { type: 'flag', key: 'jy_toad', value: true },
              {
                type: 'narrate',
                text: '你伏地鼓息，喉間發奇聲。蟾群竟不避你。練罷嘴角發麻，掌緣却多了股陰勁——旁人說你笑起來有點不像好人。',
              },
            ],
          },
        ],
      },
      {
        id: 'take_plate',
        text: '只撈鐵牌',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 25 },
              { type: 'martial', amount: 2 },
              {
                type: 'narrate',
                text: '鐵牌鏽蝕，背面卻有穴道圖。你沒練那邪功，圖還能賣給大夫換銀。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '嫌惡，遠離',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xia: 1 } },
              {
                type: 'narrate',
                text: '你啐一口，繞道而行。池聲閣閣，像在嘲笑你膽小——你寧願被笑。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_jade_bee',
    title: '玉蜂漿',
    body: '山坳蜂巢色白如玉，老人說蜜能療傷，亦能令經脈驟漲。',
    tags: ['special', 'martial', 'jinyong'],
    weight: 5,
    requirements: { minAge: 14, once: true },
    choices: [
      {
        id: 'eat',
        text: '取蜜服下',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 25 },
              { type: 'maxHealth', amount: 10 },
              { type: 'qi', amount: 20 },
              { type: 'martial', amount: 4 },
              { type: 'flag', key: 'jy_jade_bee', value: true },
              {
                type: 'narrate',
                text: '蜜甜入喉，傷口癢得想笑。你躺了一個時辰，氣血竟活潑起來——臂上舊疤也淡了。',
              },
            ],
          },
        ],
      },
      {
        id: 'salve',
        text: '煉成傷藥',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 30 },
              { type: 'reputation', amount: 2 },
              { type: 'health', amount: 8 },
              {
                type: 'narrate',
                text: '你把蜜煉成膏。鎮裡跌打師傅出了高價，也留了一盒給你自己——江湖路遠，膏比銀管用。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '怕蜂群，不取',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '蜂翼如雨。你退到林外，只帶走一點甜香——有時不拿，也是一種本事。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_beggar_chicken',
    title: '叫化贈雞',
    body: '橋洞老叫化烤着泥封雞，見你飢餓，招手：「吃完，聽我說兩句。」',
    tags: ['ordinary', 'martial', 'jinyong', 'story'],
    weight: 14,
    requirements: { minAge: 12, maxAge: 55 },
    choices: [
      {
        id: 'eat_learn',
        text: '吃雞並請教',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 12 },
              { type: 'martial', amount: 6 },
              { type: 'attr', delta: { wuXing: 1 } },
              { type: 'nature', delta: { xia: 1 } },
              { type: 'flag', key: 'met_beggar_chef', value: true },
              {
                type: 'narrate',
                text: '雞香穿透泥殼。叫化邊啃邊點你肩肘：「力要散，不要死頂。」你記下了。他抹嘴便走，像從沒出現過。',
              },
            ],
          },
        ],
      },
      {
        id: 'share',
        text: '分酒與他對酌',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -6 },
              { type: 'reputation', amount: 2 },
              { type: 'martial', amount: 2 },
              { type: 'nature', delta: { xia: 2 } },
              {
                type: 'narrate',
                text: '酒薄，話卻厚。他說江湖最大的門派是「肚子」。你笑出聲，口袋輕了，心倒寬了。',
              },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        text: '疑是圈套，走開',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你拱手離去。背後傳來一聲唏噓：「年輕人，香都不識。」泥爐還在冒煙。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_temple_eavesdrop',
    title: '破廟偷拳',
    body: '夜雨破廟，兩名高手借殿比劃。你躲在供桌下，呼吸都不敢重。',
    tags: ['ordinary', 'martial', 'jinyong'],
    weight: 12,
    requirements: { minAge: 13, maxAge: 50 },
    choices: [
      {
        id: 'watch',
        text: '屏息偷學',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 7 },
              { type: 'attr', delta: { wuXing: 2, danShi: 1 } },
              { type: 'flag', key: 'jy_eavesdrop', value: true },
              {
                type: 'narrate',
                text: '掌風擦過桌帷。你把步法數進心裡，雨停人去，地上只剩兩行濕腳印——夠你揣摩半年。',
              },
            ],
          },
        ],
      },
      {
        id: 'cough',
        text: '忍不住出聲',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -15 },
              { type: 'money', amount: -20 },
              { type: 'reputation', amount: -3 },
              {
                type: 'narrate',
                text: '你一咳，兩人同時轉身。挨了兩記「教訓」後被扔出廟門，銀子也少了——偷師不成，先交學費。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '趁早溜走',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 1 },
              {
                type: 'narrate',
                text: '你從後窗翻走。雨聲蓋住腳步。今夜沒學到招，卻學到：命比拳重要。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_lake_sword',
    title: '湖底沉劍',
    body: '枯水季湖心露出一柄青鋒，劍穗纏着舊布，像有人故意沉下。',
    tags: ['ordinary', 'martial', 'gear', 'jinyong'],
    weight: 10,
    requirements: { minAge: 16, once: true },
    choices: [
      {
        id: 'dive',
        text: '潛水拔劍',
        outcomes: [
          {
            effects: [
              { type: 'grantGear', gearId: 'old-sword' },
              { type: 'martial', amount: 5 },
              { type: 'health', amount: -8 },
              { type: 'flag', key: 'jy_lake_sword', value: true },
              {
                type: 'narrate',
                text: '湖水冷入骨髓。你握住劍柄上浮，刃上無鏽，像剛出鞘。岸上有人遠遠看了一眼，又低頭走了。',
              },
            ],
          },
        ],
      },
      {
        id: 'mark',
        text: '做記號，改日再取',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 1 },
              {
                type: 'narrate',
                text: '你在柳樹上刻了痕。再來時水位漲了，劍影不見——江湖的東西，很少等人。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '怕是凶物，不取',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你退回官道。湖面復平，像什麼都沒有發生過。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_desert_map',
    title: '大漠殘圖',
    body: '商隊遺落半張羊皮圖，沙土掩着「千裏之外，刀光如月」八字。',
    tags: ['ordinary', 'jinyong', 'adventure'],
    weight: 11,
    requirements: { minAge: 18 },
    choices: [
      {
        id: 'follow',
        text: '按圖西行數日',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 45 },
              { type: 'martial', amount: 4 },
              { type: 'health', amount: -12 },
              { type: 'attr', delta: { fuYuan: 1 } },
              {
                type: 'narrate',
                text: '沙丘後竟是枯井與一箱舊銀。你帶走能拿的，把圖燒了——免得再有人為它丟命。',
              },
            ],
          },
        ],
      },
      {
        id: 'sell_map',
        text: '賣給西域商胡',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 28 },
              {
                type: 'narrate',
                text: '商胡看圖眼神發直，銀子數得飛快。你沒西行，却把風險賣了出去。',
              },
            ],
          },
        ],
      },
      {
        id: 'discard',
        text: '撕碎棄於風',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '羊皮片片飛進沙暴。你拍拍手，繼續趕路——有些地圖，是給貪心人準備的。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_rival_letter',
    title: '挑戰帖到',
    body: '一紙戰書壓着斷箭：「三日後林外比武，敗者斷一指。」署名模糊。',
    tags: ['ordinary', 'combat', 'jinyong', 'road'],
    weight: 12,
    requirements: { minAge: 16, minMartial: 12 },
    choices: [
      {
        id: 'accept',
        text: '應戰',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 5 },
              { type: 'reputation', amount: 4 },
              { type: 'health', amount: -16 },
              { type: 'nature', delta: { kuang: 1 } },
              {
                type: 'narrate',
                text: '林外塵起。你勝得難看，對方斷袖而逃。帖子被你揉成團——手指還在，名卻響了半分。',
              },
            ],
          },
        ],
      },
      {
        id: 'delay',
        text: '回帖改期',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: -1 },
              { type: 'martial', amount: 2 },
              {
                type: 'narrate',
                text: '你回帖「病體未癒」。對方竟真的等了半月。你多練了幾場，心裡却發虛：拖延也是一種刀。',
              },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        text: '當作無見物',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: -4 },
              {
                type: 'narrate',
                text: '三日後林外空無一人。鎮裡却開始傳：你怯戰。閒話比斷箭更尖。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_wedding_escape',
    title: '花轎劫緣',
    body: '山道花轎顛簸，轎中人低呼「救命」。追兵尘土已見。',
    tags: ['ordinary', 'romance', 'jinyong', 'story'],
    weight: 10,
    requirements: { minAge: 16, maxAge: 45 },
    choices: [
      {
        id: 'save',
        text: '截轎相救',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 6 },
              { type: 'nature', delta: { xia: 3 } },
              { type: 'health', amount: -12 },
              { type: 'money', amount: -10 },
              { type: 'flag', key: 'jy_wedding_save', value: true },
              {
                type: 'narrate',
                text: '你砍斷轎槓，帶人鑽進竹林。追兵咒罵遠去。對方只留下一枚玉佩：「他日西湖，還你這個人情。」',
              },
            ],
          },
        ],
      },
      {
        id: 'watch',
        text: '袖手旁觀',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xie: 1 } },
              {
                type: 'narrate',
                text: '花轎遠了，哭聲也遠了。你站在道旁很久，像把什麼東西一起送走了。',
              },
            ],
          },
        ],
      },
      {
        id: 'report',
        text: '通報官差',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 2 },
              { type: 'world', delta: { order: 2 } },
              {
                type: 'narrate',
                text: '官差來時轎已無影。你得了句「義士」，也得了句「多事」。官道恢復平靜，像從來沒有花轎。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_drunken_fist',
    title: '醉漢傳拳',
    body: '酒肆角落，醉漢把酒壺當兵器，步法卻奇準。店小二說他從前是名家。',
    tags: ['ordinary', 'martial', 'jinyong'],
    weight: 13,
    requirements: { minAge: 15, maxAge: 60 },
    choices: [
      {
        id: 'toast',
        text: '敬酒求教',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -12 },
              { type: 'learnSkill', skillId: 'jy_drunk_step', name: '醉步殘影' },
              { type: 'martial', amount: 8 },
              { type: 'attr', delta: { danShi: 2 } },
              {
                type: 'narrate',
                text: '三碗下肚，他扯你手腕：「跟我晃。」你在桌椅間摔了兩回，竟摸着了重心。醒來時桌上一張欠條——酒錢你付。',
              },
            ],
          },
        ],
      },
      {
        id: 'carry',
        text: '扶他回去',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xia: 2 } },
              { type: 'reputation', amount: 2 },
              { type: 'martial', amount: 2 },
              {
                type: 'narrate',
                text: '他一路哼曲，臨別塞你半本拳譜油紙：「別學我喝酒。」字跡歪斜，招式卻真。',
              },
            ],
          },
        ],
      },
      {
        id: 'mock',
        text: '嘲笑走開',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { e: 1 } },
              {
                type: 'narrate',
                text: '你笑他瘋。他忽然睜眼，酒氣裡有刀：「年輕人，嘴比拳快，死得也快。」你沒接話，卻記住了這句。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_snow_herb',
    title: '雪山靈藥',
    body: '雪線下開着一株奇草，葉背有霜紋。牧人說可大補，也可逼出隱傷。',
    tags: ['ordinary', 'jinyong', 'martial'],
    weight: 11,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'brew',
        text: '熬湯服下',
        outcomes: [
          {
            effects: [
              { type: 'maxHealth', amount: 14 },
              { type: 'health', amount: 20 },
              { type: 'maxQi', amount: 8 },
              { type: 'martial', amount: 3 },
              {
                type: 'narrate',
                text: '湯苦得掉淚。一碗落肚，四肢發熱，舊傷像被火燎過——疼過之後，反而更活。',
              },
            ],
          },
        ],
      },
      {
        id: 'sell_herb',
        text: '帶回鎮上售賣',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 55 },
              {
                type: 'narrate',
                text: '藥鋪掌櫃雙眼放光。銀兩過手時，他叮囑：「別說從哪采的。」你點頭，把雪山留在背後。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '原株留下',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xia: 1 } },
              {
                type: 'narrate',
                text: '你培了培雪。草還在風裡顫。有些藥，留給下一個快死的人更合適。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_poison_finger',
    title: '指上劇毒',
    body: '敵人以毒針擦過你袖口。老醫師說：要麼以毒攻毒，要麼切去指尖。',
    tags: ['ordinary', 'jinyong', 'risk'],
    weight: 9,
    requirements: { minAge: 16, once: true },
    choices: [
      {
        id: 'counter',
        text: '以毒攻毒硬抗',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 10 },
              { type: 'martial', amount: 5 },
              { type: 'health', amount: -22 },
              { type: 'condition', id: 'poison' },
              { type: 'flag', key: 'jy_poison_finger', value: true },
              {
                type: 'narrate',
                text: '藥與毒在血裡打架。你燒了三天，醒來指尖發黑却還在——經脈像被砂紙打過，反而更耐得住濁氣。',
              },
            ],
          },
        ],
      },
      {
        id: 'cut',
        text: '咬牙切斷指尖',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -30 },
              { type: 'martial', amount: -2 },
              { type: 'attr', delta: { danShi: -1 } },
              { type: 'nature', delta: { kuang: 1 } },
              {
                type: 'narrate',
                text: '刀起指落。血很快止住，毒也止住了。日後握劍微晃，你却活着——有些完整，要用殘缺換。',
              },
            ],
          },
        ],
      },
      {
        id: 'delay',
        text: '先尋解藥',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -35 },
              { type: 'health', amount: -8 },
              { type: 'reputation', amount: 1 },
              {
                type: 'narrate',
                text: '你跑了三家醫館，銀子與眼淚一起花。毒壓住了，指還在——醫生說運氣好。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_blind_zither',
    title: '盲者鼓琴',
    body: '渡口盲琴師彈至半曲停住：「你腳步亂。要聽，便坐下。」',
    tags: ['ordinary', 'martial', 'jinyong', 'story'],
    weight: 12,
    requirements: { minAge: 14 },
    choices: [
      {
        id: 'listen',
        text: '坐下聽完整曲',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 5 },
              { type: 'attr', delta: { wuXing: 2, meiLi: 1 } },
              { type: 'qi', amount: 12 },
              {
                type: 'narrate',
                text: '琴音裡有刀法的起伏。曲終他說：「呼吸跟弦走。」你起身時步子穩了——原來耳朵也能練武。',
              },
            ],
          },
        ],
      },
      {
        id: 'pay',
        text: '擲銀請他點撥',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -15 },
              { type: 'martial', amount: 8 },
              { type: 'learnSkill', skillId: 'jy_zither_breath', name: '弦息法' },
              {
                type: 'narrate',
                text: '他以琴桿點你肩井、氣海。銀子響時他笑：「聽得見銀，也聽得見心。」你記下弦息，渡船剛好靠岸。',
              },
            ],
          },
        ],
      },
      {
        id: 'pass',
        text: '趕路不停',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '琴聲追了你一程，又被水聲蓋過。你沒坐下，便也沒有下文。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_manual_burn',
    title: '火中搶譜',
    body: '仇家火燒藏書樓。煙裡隱約可見一冊未燃盡的拳譜。',
    tags: ['ordinary', 'martial', 'jinyong', 'risk'],
    weight: 9,
    requirements: { minAge: 15, once: true },
    choices: [
      {
        id: 'rush',
        text: '衝入搶譜',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'jy_ash_manual', name: '灰中拳' },
              { type: 'martial', amount: 10 },
              { type: 'health', amount: -20 },
              { type: 'condition', id: 'scar' },
              { type: 'nature', delta: { kuang: 2 } },
              { type: 'flag', key: 'jy_manual_burn', value: true },
              {
                type: 'narrate',
                text: '火舌舔臂。你搶出半冊焦譜，咳得見血。字燒糊了，拳意却進了骨頭——疤會提醒你這晚。',
              },
            ],
          },
        ],
      },
      {
        id: 'bucket',
        text: '先救火再尋',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 5 },
              { type: 'nature', delta: { xia: 2 } },
              { type: 'martial', amount: 2 },
              { type: 'health', amount: -6 },
              {
                type: 'narrate',
                text: '你提桶來去。樓塌大半，譜已成灰，街坊却記得你的臉——有時救人比搶譜更值錢。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '遠觀不介入',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '火光映紅半邊天。你站得夠遠，煙也夠遠——拳譜與命，今晚都不屬於你。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_lonely_sword_tomb',
    title: '劍塚試鋒',
    body: '荒野劍塚插滿銹劍，中央一柄無銹。碑文：拔者需以武會友，不得盜搶。',
    tags: ['ordinary', 'martial', 'gear', 'jinyong'],
    weight: 8,
    requirements: { minAge: 17, minMartial: 20, once: true },
    choices: [
      {
        id: 'draw',
        text: '依禮拔劍比試幻影',
        outcomes: [
          {
            effects: [
              { type: 'grantGear', gearId: 'iron-blade' },
              { type: 'martial', amount: 7 },
              { type: 'reputation', amount: 3 },
              { type: 'health', amount: -10 },
              {
                type: 'narrate',
                text: '拔劍瞬間，似有人影對你連刺三招。你撐過，劍歸入手——塚風息了，像點了點頭。',
              },
            ],
          },
        ],
      },
      {
        id: 'bow',
        text: '只祭拜不取',
        outcomes: [
          {
            effects: [
              { type: 'nature', delta: { xia: 2 } },
              { type: 'martial', amount: 3 },
              { type: 'qi', amount: 10 },
              {
                type: 'narrate',
                text: '你插香退去。離開十步，背後錚然一響——地上多了一塊劍穗，像謝禮。',
              },
            ],
          },
        ],
      },
      {
        id: 'steal',
        text: '強行拔走',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -25 },
              { type: 'condition', id: 'internal' },
              { type: 'nature', delta: { e: 2 } },
              { type: 'reputation', amount: -5 },
              {
                type: 'narrate',
                text: '劍出鞘反噬內息。你吐血鬆手，劍自行沒入土中。碑文像譏諷：盜者，先盜走自己的體面。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_peach_island',
    title: '桃花塢謎',
    body: '江心小島桃花盛開，石桌上殘局未完，旁寫：「解者可在此住一晚。」',
    tags: ['ordinary', 'jinyong', 'story'],
    weight: 10,
    requirements: { minAge: 16, minAttrs: { wuXing: 35 }, once: true },
    choices: [
      {
        id: 'solve',
        text: '推演殘局',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { wuXing: 3 } },
              { type: 'martial', amount: 4 },
              { type: 'qi', amount: 15 },
              { type: 'flag', key: 'jy_peach', value: true },
              {
                type: 'narrate',
                text: '你落子，江風忽然順了。石桌微震，縫裡彈出一枚玉笛。夜宿島上，夢裡有人笑你「還嫩」。',
              },
            ],
          },
        ],
      },
      {
        id: 'eat_peach',
        text: '只吃桃便走',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 10 },
              { type: 'money', amount: 5 },
              {
                type: 'narrate',
                text: '桃甜。你沒碰棋。離島時口袋多了兩枚桃核——像島主人不計較。',
              },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '怕有陷阱，離去',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '桃花落在你肩上。你抖落，上船。殘局仍在風裡，等下一個更閒的人。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_drowned_revive',
    title: '落水回陽',
    body: '橋斷落水，氣絕之際，有人渡真氣入你膻中，喝道：「別睡！」',
    tags: ['ordinary', 'martial', 'jinyong'],
    weight: 8,
    requirements: { minAge: 12, once: true },
    choices: [
      {
        id: 'cling',
        text: '咬牙承接內力',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 15 },
              { type: 'qi', amount: 30 },
              { type: 'martial', amount: 6 },
              { type: 'health', amount: 15 },
              { type: 'flag', key: 'jy_revive', value: true },
              {
                type: 'narrate',
                text: '一股熱流撞開你淤塞的氣脈。你嗆出半湖水，岸上只留斗笠。恩人無蹤，內息却記得那隻掌。',
              },
            ],
          },
        ],
      },
      {
        id: 'ask',
        text: '醒來追問姓名',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 2 },
              { type: 'nature', delta: { xia: 1 } },
              {
                type: 'narrate',
                text: '對方只道「江湖見」。斗笠壓低，步子卻是名門。你記住背影，沒記住名字。',
              },
            ],
          },
        ],
      },
      {
        id: 'refuse_qi',
        text: '懼內力衝突，拒絕',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -10 },
              {
                type: 'narrate',
                text: '你掙扎搖頭。對方嘆一聲，改用土法按腹排水。你活了，卻錯過一場灌頂——怕，有時也貴。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_black_wind_ambush',
    title: '黑風雙影',
    body: '林間一陣腥風，一高一矮兩道黑影截路：「留下乾糧，或留下耳朵。」',
    tags: ['ordinary', 'combat', 'road', 'jinyong'],
    weight: 11,
    requirements: { minAge: 15, maxAge: 65 },
    choices: [
      {
        id: 'fight',
        text: '硬拚突圍',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 4 },
              { type: 'reputation', amount: 2 },
              { type: 'health', amount: -18 },
              { type: 'money', amount: 15 },
              {
                type: 'narrate',
                text: '高的刀沉，矮的針快。你挨了兩下，也割破對方面巾。他們罵罵咧咧退進林——包裹裡多了些來路不明的銀。',
              },
            ],
          },
        ],
      },
      {
        id: 'bribe',
        text: '丟銀買路',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -25 },
              { type: 'health', amount: 2 },
              {
                type: 'narrate',
                text: '銀錠落地，雙影瞬合。你低頭快走，耳朵還在——貴是貴，比缺一塊肉便宜。',
              },
            ],
          },
        ],
      },
      {
        id: 'trick',
        text: '拋煙迷眼逃脫',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -5 },
              { type: 'attr', delta: { danShi: 1 } },
              { type: 'nature', delta: { xie: 1 } },
              {
                type: 'narrate',
                text: '石灰粉揚起。咳嗽聲裡你鑽出林道。不算光彩，卻有效——江湖不發獎狀給逃得快的人。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'jy_ice_fire_remnant',
    title: '冰火島餘燼',
    body: '海商談起遠島：一邊烈火岩，一邊寒冰洞，有人在其間練成怪功。',
    tags: ['special', 'martial', 'secret', 'jinyong'],
    weight: 4,
    requirements: { minAge: 20, once: true, minMoney: 30 },
    choices: [
      {
        id: 'voyage',
        text: '出資隨船尋島',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -40 },
              { type: 'maxQi', amount: 20 },
              { type: 'maxHealth', amount: 10 },
              { type: 'martial', amount: 9 },
              { type: 'health', amount: -14 },
              { type: 'learnSkill', skillId: 'jy_ice_fire', name: '冰火二重' },
              { type: 'flag', key: 'jy_ice_fire', value: true },
              {
                type: 'narrate',
                text: '你在炙岩與冰洞之間來回蹲站，牙關打顫又冒汗。回航時內息像兩條蛇盤在一起——難受，却強。',
              },
            ],
          },
        ],
      },
      {
        id: 'hear',
        text: '只聽故事長見識',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { wuXing: 1 } },
              { type: 'money', amount: -3 },
              {
                type: 'narrate',
                text: '你請酒聽完。海上的島未必有，酒話裡的胆色却真。你把「冰火」二字寫進日記。',
              },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        text: '笑為妄言',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你搖頭離席。窗外潮聲陣陣，像有島在很遠的地方響了一下，又沒有。',
              },
            ],
          },
        ],
      },
    ],
  },
];

function badStory(_id: string, text = '此舉'): string {
  return `你欲「${text}」，却在緊要處失了分寸：毒、寒或刀風反噬而來。事與願違之後，你把教訓嚥進肚裡，把命繼續往前帶。`;
}

export const JINYONG_TROPE_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    (id, text) => [
      { type: 'narrate', text: badStory(id, text) },
      { type: 'health', amount: -14 },
      { type: 'money', amount: -8 },
    ],
    0.14,
  ),
);

export const JINYONG_SPECIAL_EVENTS = JINYONG_TROPE_EVENTS.filter((e) =>
  (e.tags ?? []).includes('special'),
);

export const JINYONG_ORDINARY_EVENTS = JINYONG_TROPE_EVENTS.filter(
  (e) => !(e.tags ?? []).includes('special'),
);

export const JINYONG_TROPE_COUNT = JINYONG_TROPE_EVENTS.length;
