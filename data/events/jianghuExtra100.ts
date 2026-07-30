import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

/**
 * 江湖百事：100 則日常／遊歷向事件（原創文案；題材參考話本、名著氛圍與武俠網遊奇遇類型，如黑店、鏢局、擂台、殘譜、經脈走火等，不使用受保護專名）。
 * 搭配 recentEvents 50 月冷卻，降低短線重複。
 */
const RAW: GameEvent[] = [
  {
    id: "jx_black_inn",
    title: "夜宿黑店",
    body: "山道客棧燈火昏黃，掌櫃笑得過分殷勤，酒裡似有異味。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你提燈近前，原來是落難之人。你分了乾糧，換來一句真心道謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你不深入，在外枕刀而眠。夜裡有腳步兩次徘徊，見你醒着便走了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你寧可多走一程。銀子少了，卻睡得踏實。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_escort_cart",
    title: "鏢車過鎮",
    body: "一輛鏢車軋過青石板，鏢旗獵獵，車轍旁有人鬼祟窺視。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "escort"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "義務護鏢",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你隨車護送出鎮。林蔭處響馬試探，被你喝退。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "收點護路費",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 15
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你談妥護路銀。一路無事，銀子進袋。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只看熱鬧",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你躲在茶棚看完經過，聽見半句貨在第三箱。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bandit_toll",
    title: "剪徑索銀",
    body: "山口橫着幾人，刀背拍掌：買路錢，少一文打斷腿。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "bandit"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "丟銀過關",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你拋出銀子。匪徒讓路，你捏緊刀柄走過。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "硬闖則過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -10
              },
              {
                type: "martial",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你拔刀硬闖。匪徒散開，你衣袖見血。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞山小徑",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你退回岔路翻過山脊。多走半日，避開惡戰。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bridge_duel",
    title: "橋頭約戰",
    body: "石橋中央插着一把竹劍，旁寫：有膽者，過橋一試。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "duel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "應戰比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你應下約戰，交手數招。勝負另說，汗水與刀風倒讓你清醒許多。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以禮化解",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你拱手致意，言明不為意氣。對方一愣，收勢讓路——有時退一步，名望反增。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞道而行",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不戀戰，另擇路徑。勝負留給願意逞強的人。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ruin_temple",
    title: "破廟夜雨",
    body: "破廟漏雨，塑像缺臂。牆角似有人影蜷縮。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你提燈近前，原來是落難之人。你分了乾糧，換來一句真心道謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你不深入，在外枕刀而眠。夜裡有腳步兩次徘徊，見你醒着便走了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你寧可多走一程。銀子少了，卻睡得踏實。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_poison_mist",
    title: "谷口毒霧",
    body: "山谷瀰漫淡綠薄霧，藥香混着腐味，深處似有殘碑。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "poison"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "屏息快過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你以內息護體硬闖。喉嚨發苦，卻撿回一點有用的線索。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "製作面罩",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你撕布浸水掩口鼻，慢慢試探，把路徑記清。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸人勿入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你攔住後來者說明危險。眾人改道，你也沒貪那點便宜。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lost_manual",
    title: "殘譜飄落",
    body: "一陣風吹來黃紙殘頁，字跡潦草，隱約是步法圖。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "manual"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "收下研讀",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你將殘頁收入懷中反覆比劃。雖不成系統，身法卻活了一寸。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "張貼尋主",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "money",
                amount: 8
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你貼出失物招領。主人以銀相謝，並指點你一式。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "置之不理",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你怕是陷阱，由它去。有些機緣，不强求也罷。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_arena_challenge",
    title: "擂台叫陣",
    body: "鎮中擂台有人擊鼓叫陣：有本事的，上來領銀！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "arena"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上台應戰",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "money",
                amount: 12
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "鼓聲中你躍上台。三招兩式分出高下——賞銀入手，肩頭也青了一塊。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "在下觀摩",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你不上場，只看步法與呼吸，默記兩處破綻。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸止血腥",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你高聲勸點到為止。有人噓你，也有人點頭。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_tea_master",
    title: "茶棚說劍",
    body: "茶博士一邊沏茶一邊講昨夜誰在碼頭比劍，聽客圍成一圈。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rumor"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仔細聽完",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你把人名地名都記住。茶涼了，江湖版圖卻亮了一角。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "出錢請詳",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 4
                }
              },
              {
                type: "narrate",
                text: "你添一碟花生，對方把壓箱底傳聞也倒了出來。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "揭穿誇大",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你指出破綻，茶客哄笑。誇大的故事被拆穿，也算小事一樁。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ferry_ghost",
    title: "渡口怪談",
    body: "老船工說對岸有鬼火，年輕船伕卻只笑他喝醉。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ferry"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "僱船夜探",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你僱船靠岸。所謂鬼火是盜掘的燈——交手一場，得了些散銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "白日再渡",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不冒險，次日陽光下安然渡河。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "記錄傳聞",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你把怪談寫進冊子。真假不論，至少能嚇退糊塗劫匪。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_herb_cliff",
    title: "絕壁採藥",
    body: "藥農指着峭壁：那簇靈芝值二十兩，敢上去的對半分。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "herb"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "攀崖一試",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "health",
                amount: -10
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你攀岩採藥。對方守信分銀，你手肘擦破，膽氣卻長了。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "在下接應",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你在崖底拉繩接應，雙方都少了風險。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸他勿貪",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你勸風大勿上。他收起繩索——保住的是命。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_qin_pavilion",
    title: "亭中撫琴",
    body: "湖心亭有人撫琴，曲聲忽滯——弦斷，琴者臉色發白。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你幫忙解圍。對方拱手相謝，願結文字之交。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你奉上薄禮請教。琴棋書畫與武學一理，這一課開了竅。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你不打擾，只把意境記在心裡。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_go_match",
    title: "棋亭殘局",
    body: "石桌上擺着殘局，旁題：解此局者，請茶三碗。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你幫忙解圍。對方拱手相謝，願結文字之交。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你奉上薄禮請教。琴棋書畫與武學一理，這一課開了竅。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你不打擾，只把意境記在心裡。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_calligraphy_wall",
    title: "粉牆題字",
    body: "客棧粉牆新題墨蹟未乾，字勢張狂，似挑戰當地名家。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你幫忙解圍。對方拱手相謝，願結文字之交。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你奉上薄禮請教。琴棋書畫與武學一理，這一課開了竅。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你不打擾，只把意境記在心裡。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_painting_scroll",
    title: "舊畫藏機",
    body: "地攤一幅山水，遠峰線條裡竟藏着路線符號。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "treasure"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線探索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你依線找到舊處。無金山，卻有散銀與銹劍。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣掉線索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 20
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你把線索賣給牙行。銀子爽快，夜裡卻有點空。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "公開於眾",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把線索交公議，免得惹出血案。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_beggar_hint",
    title: "丐者密語",
    body: "一個瘸腿乞丐扯你衣角，低聲說西巷今夜有貨。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前理論。場面平息，有人拍手，也有人記恨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你三言兩語把事圓了，順便得了點謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你當沒看見。江湖很大，不是每件事都該伸手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_thief_chase",
    title: "竊賊飛簷",
    body: "屋頂人影一閃，包裹落地滾到你腳邊。後方追喊：攔住他！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "chase"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "攔截竊賊",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "money",
                amount: 10
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你截住竊賊，物歸原主。失主塞你謝銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "撿起包裹",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你撿起包裹轉身就走。銀飾入手，背後罵聲遠了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "指路官差",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你向官差指明方向，少了場惡鬥。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_medical_debt",
    title: "醫館討債",
    body: "醫館外有人哭喊被索重金，郎中堅稱藥石值錢。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "clinic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "代付藥金",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你替人付了藥金。病人哭謝，郎中悄悄少收了你兩成。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "查驗藥方",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你逼問劑量，發現誇大處，雙方各退一步。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不介入",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你不是判官，默默離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_drunk_swordsman",
    title: "醉漢舞劍",
    body: "酒肆裡一名醉漢以酒壺當劍，險些劈到過路客。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "tavern"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "制住醉漢",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你點穴制住醉漢，避免傷人。老板送酒致謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "陪他喝完",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你陪喝，聽醉話裡的舊仇，天亮得了條線索。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "報官了事",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你叫來巡夜，醉漢被架走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_wedding_crash",
    title: "喜事橫刀",
    body: "迎親隊被攔在巷口，紅蓋頭微顫，對方索要過路彩禮。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前理論。場面平息，有人拍手，也有人記恨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你三言兩語把事圓了，順便得了點謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你當沒看見。江湖很大，不是每件事都該伸手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_wanted_poster",
    title: "海捕文書",
    body: "城門新貼畫像，賞金不菲，五官與你有幾分相似。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你主動說明來歷，花了些打點銀，烏雲散了些。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你易服混出城門。安全第一。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你循線追查，險些中伏，卻摸到關鍵人名。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_spy_letter",
    title: "密信錯投",
    body: "飛鴿落下，腳環密信寫着門派暗號——收件人卻不是你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你原件交還。對方記你人情。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你私下拆讀再封回。知情是刃，也能割傷自己。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你投入爐火。灰燼裡，江湖少了一條線。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_fire_ward",
    title: "巷中失火",
    body: "半夜火起，婦孺尖叫。水桶傳着傳着，人手不夠。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你捲袖投入。煙塵之後，街坊記住了你的臉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你高聲分工，事半功倍。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你不靠近危險，只把始末看清。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_kidnap_ransom",
    title: "綁票紙條",
    body: "窗縫塞進一張紙：三日內銀五十兩，否則撕票。字跡稚嫩。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "crime"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "報官揭露",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你把線索送官。風險轉給公門。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下解決",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你夜半突襲了事。銀子與刀傷一起到手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝沒看見",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你轉身離開。有些黑，你暫時不想碰。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_tomb_lantern",
    title: "荒塚青燈",
    body: "亂葬崗一盞青燈不滅，風吹不熄，近處有新挖痕跡。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "tomb"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "近前喝止",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你喝止盜掘。對方逃散，你把土堆回原樣。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "暗中跟隨",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你尾隨分成一點封口費。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠離是非",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你覺得邪門，繞道離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lake_ice",
    title: "湖面薄冰",
    body: "冬湖結薄冰，有孩童滑倒中央，冰裂聲細細傳來。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rescue"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "奮力施救",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 4
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你不顧危險救人。事成後哭謝聲不絕。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "呼叫眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你高喊求援，眾人協力。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "量力而行",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你判斷硬衝只會多死人，先穩陣腳。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_meridian_block",
    title: "經脈滯澀",
    body: "運功時胸口一窒，像有熱流逆走——旁人勸你去找明醫。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "cultivation"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "停功就醫",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "health",
                amount: 12
              },
              {
                type: "qi",
                amount: 15
              },
              {
                type: "maxQi",
                amount: 3
              },
              {
                type: "narrate",
                text: "你求醫調息。銀子少了，經脈卻順了。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "硬衝破關",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -12
              },
              {
                type: "maxQi",
                amount: 8
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你咬牙逆轉氣機。險後打通一關，人也蒼白幾日。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "溫養靜待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 10
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你減練外功，只做吐納。慢，卻穩。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_qi_deviation",
    title: "走火徵兆",
    body: "打坐時耳鳴目眩，眼前金星亂迸，舊傷隱隱作痛。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "cultivation"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "停功就醫",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "health",
                amount: 12
              },
              {
                type: "qi",
                amount: 15
              },
              {
                type: "maxQi",
                amount: 3
              },
              {
                type: "narrate",
                text: "你求醫調息。銀子少了，經脈卻順了。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "硬衝破關",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -12
              },
              {
                type: "maxQi",
                amount: 8
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你咬牙逆轉氣機。險後打通一關，人也蒼白幾日。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "溫養靜待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 10
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你減練外功，只做吐納。慢，卻穩。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lightness_race",
    title: "屋脊競速",
    body: "兩三少年在屋脊上比輕功，瓦片紛落，街坊叫苦。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "qinggong"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "加入比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你躍上屋脊比了兩段。瓦涼如雪，笑聲散在巷風裡。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "喝止危險",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你喝止別踩塌民房。少年散去，街坊作揖。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "在下偷師",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你不現身，只看落點與借力。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_hidden_weapon",
    title: "暗器無聲",
    body: "茶煙裡一點寒芒擦耳而過，釘進柱子——是枚細針。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ambush"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻反擊",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -7
              },
              {
                type: "money",
                amount: 5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你反手追擊。刺客逃了，留下標記與散銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "護住弱者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你先把路人推開，自己扛了險。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "低調撤離",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你感到殺意未盡，先離開人群。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_broken_blade",
    title: "斷刃求修",
    body: "鐵匠攤前一位刀客捧着斷刀，眼神發紅：還能接否？",
    tags: [
      "ordinary",
      "jianghu_extra",
      "gear"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出資修復",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -15
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你付錢幫修。對方感激，傳你一式拆刀手法。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以物易物",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你用閑置物換一點實戰心得。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只給指點",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你指出問題所在。對方沉默離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_sword_polish",
    title: "磨劍聽雨",
    body: "雨廊裡有人慢磨長劍，砂石聲與雨聲合拍，旁若無人。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sword"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "請教劍意",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "money",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你奉茶請教。他不傳招式，只談劍在意先。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "默契對練",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你們過了幾招。無仇無恨，只有劍風。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不打擾",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你靜靜聽完才離開。有些修行需要安靜。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_palm_demo",
    title: "掌法賣藝",
    body: "廣場有人打掌花，木樁應聲而裂，圍觀者丟銅板。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "palm"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "丟錢叫好",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你投了銅板。賣藝人額外展示一式收掌。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "上台過招",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你上台點到為止。雙方拱手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "指出破綻",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你低聲指出破綻。他一愣，隨即請教。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_staff_monk",
    title: "行腳僧杖",
    body: "僧人拄杖问路，杖頭鐵環輕響，目光卻掃過你腰間兵刃。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "monk"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "坦誠相告",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你指路並問安。僧人送你一串念珠壓驚。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "試探來歷",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你旁敲側擊。他笑而不答，反問你心性。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "保持距離",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你簡單指路便走。江湖裡太多面具。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_whip_merchant",
    title: "鞭商叫賣",
    body: "商販甩鞭驅蠅：軟鞭護身，遠近皆宜！目光落在你身上。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "whip"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "買下一條",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -18
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "narrate",
                text: "你買下軟鞭練習手感。兵器多一樣，路也多一條。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請他示範",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你付錢看示範。鞭梢繞花的勁道，比空講有用。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "婉拒離開",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你暫時不需鞭法，拱手離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bow_hunter",
    title: "獵戶借箭",
    body: "獵戶箭盡，隔溪對你喊：借三枝箭，回來加倍還！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "bow"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "借箭相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把箭借出。後來對方加倍送還，還送乾肉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "一起圍獵",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "narrate",
                text: "你同他入林。獵物分成，箭法也練了手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不肯借",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你箭不多，搖頭拒絕。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_spear_drill",
    title: "校場槍陣",
    body: "衙役在校場練槍，隊形散亂，教頭罵聲不絕。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "spear"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "指點隊形",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你說了兩句站位。教頭先怒後默，請你喝茶。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "下場同練",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你借槍入隊。汗濕衣背，槍桿越握越穩。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只看不動",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你看完一輪操練才走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_gamble_dice",
    title: "賭坊骨骰",
    body: "賭坊裡骨骰砰然落地，有人指控灌鉛，氣氛劍拔弩張。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "gamble"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "喝止衝突",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你擋住即將出鞘的刀。賭帳另算，人命現在。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "趁亂撈錢",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 18
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "骰子亂飛時你摸走一袋銀。良心不安，口袋卻沉。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "報官查封",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你引來衙役。賭坊暫時熄燈。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_loan_shark",
    title: "印子錢局",
    body: "錢莊後門討債聲兇，欠戶跪地求緩，旁人皆作不見。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你把銀子送到需要的人手裡。袋輕了，心卻沒那麼堵。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你談妥公道，雙方各讓一步，你也得了謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看清行情與人心，沒有出手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_famine_rice",
    title: "米倉開閘",
    body: "災民擠在米倉外，官差壓陣，有人欲搶米包。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你把銀子送到需要的人手裡。袋輕了，心卻沒那麼堵。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你談妥公道，雙方各讓一步，你也得了謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看清行情與人心，沒有出手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_flood_bridge",
    title: "洪水斷橋",
    body: "大雨斷橋，兩岸喊渡，船家坐地起價。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "disaster"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出資擺渡",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你付錢讓船家減價載人。雨聲裡兩邊都說你是好人。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "搭索開路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你找繩索木板搭臨時通道。有人因此過了河。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "等待水退",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不冒險，找高處等水勢。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_snow_shelter",
    title: "風雪寄宿",
    body: "風雪封路，莊院拒客，只有柴房還開着門縫。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "travel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "共享資源",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: 4
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把乾糧水源分給同行。危難裡結成的善緣更牢靠。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "強佔有利位",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 6
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "你搶先佔據安全處。活是活了，目光卻被戳得慌。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋出路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你不與人爭，另闢蹊徑。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_heat_stroke",
    title: "酷暑中暑",
    body: "官道無人，路人忽然栽倒，臉紅如炭。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "travel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "共享資源",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: 4
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把乾糧水源分給同行。危難裡結成的善緣更牢靠。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "強佔有利位",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 6
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "你搶先佔據安全處。活是活了，目光卻被戳得慌。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋出路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你不與人爭，另闢蹊徑。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ghost_market",
    title: "鬼市燈籠",
    body: "子時荒市忽然燈籠成排，賣的盡是奇物舊物，賣家遮面。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你提燈近前，原來是落難之人。你分了乾糧，換來一句真心道謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你不深入，在外枕刀而眠。夜裡有腳步兩次徘徊，見你醒着便走了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你寧可多走一程。銀子少了，卻睡得踏實。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_mask_ball",
    title: "面具夜宴",
    body: "富戶夜宴請來客皆戴面具，酒過三巡，有人低聲談貨。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "night"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "上前查看",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你提燈近前，原來是落難之人。你分了乾糧，換來一句真心道謝。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "門外守夜",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你不深入，在外枕刀而眠。夜裡有腳步兩次徘徊，見你醒着便走了。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋住處",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "health",
                amount: 6
              },
              {
                type: "narrate",
                text: "你寧可多走一程。銀子少了，卻睡得踏實。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_rival_letter",
    title: "戰書到門",
    body: "一封戰書釘在門板：三日後林中見，敗者留兵器。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "duel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "應戰比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你應下約戰，交手數招。勝負另說，汗水與刀風倒讓你清醒許多。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以禮化解",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你拱手致意，言明不為意氣。對方一愣，收勢讓路——有時退一步，名望反增。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞道而行",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不戀戰，另擇路徑。勝負留給願意逞強的人。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_friend_debt",
    title: "故人欠銀",
    body: "舊識攔路苦笑：差十兩過關，日後雙倍還你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "friend"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "伸手相助",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你把忙幫了。人情賬記在心裡。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "有條件幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你幫一半，留一半作交換。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你搖頭。有些忙，幫了會陷進去。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_master_scold",
    title: "前輩訓斥",
    body: "路邊老者忽然杖擊你肩：肩垮、肘聳，這也叫功夫？",
    tags: [
      "ordinary",
      "jianghu_extra",
      "master"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "低頭請教",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 4
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你受了訓還拱手。老者哼一聲，反把關鍵點明。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "不服反駁",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你辯了兩句，換來一場過招。打完痛快。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "敷衍走開",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你賠笑走開，耳尖卻記下那句指點。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_child_apprentice",
    title: "童子拜師",
    body: "孩子扯你袖：教我一招防身！娘親給的糖都給你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "kind"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "溫柔以待",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你給了食物、傘或耐心。小事一樁，暖意真實。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "教導一招",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你比劃了一式防身。孩子眼睛發亮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "保持界線",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你幫到安全為止，不承諾做不到的事。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_widow_well",
    title: "井邊哭聲",
    body: "井邊婦人夜哭，說夫君入山未歸，求你帶話或尋人。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "quest"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "答應找人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你答應入山打聽。也許找不到，但至少有人在找。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "給安家銀",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你塞給她安家銀，不敢隨口打包票。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "請官差處理",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你帶她去衙門報案。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_map_half",
    title: "半張藏圖",
    body: "酒醉漢枕下掉出半張羊皮圖，標着北洞二字。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "treasure"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線探索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你依線找到舊處。無金山，卻有散銀與銹劍。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣掉線索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 20
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你把線索賣給牙行。銀子爽快，夜裡卻有點空。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "公開於眾",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把線索交公議，免得惹出血案。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_jade_drop",
    title: "落玉無主",
    body: "鬧市有人碰落玉佩，俯身去撿時已被腳踩進泥裡。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前理論。場面平息，有人拍手，也有人記恨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你三言兩語把事圓了，順便得了點謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你當沒看見。江湖很大，不是每件事都該伸手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_poison_wine",
    title: "賀酒有異",
    body: "有人敬你賀酒，色澤偏暗，香氣刺鼻。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "poison"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "屏息快過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你以內息護體硬闖。喉嚨發苦，卻撿回一點有用的線索。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "製作面罩",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你撕布浸水掩口鼻，慢慢試探，把路徑記清。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸人勿入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你攔住後來者說明危險。眾人改道，你也沒貪那點便宜。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_antidote_trade",
    title: "解藥交換",
    body: "中毒旅人顫聲：誰有解藥……我以短刃交換。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "poison"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "屏息快過",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你以內息護體硬闖。喉嚨發苦，卻撿回一點有用的線索。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "製作面罩",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -3
              },
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你撕布浸水掩口鼻，慢慢試探，把路徑記清。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "勸人勿入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你攔住後來者說明危險。眾人改道，你也沒貪那點便宜。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_sect_patrol",
    title: "師門巡邏",
    body: "門中弟子列隊巡街，目光銳利，似在尋細作。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你原件交還。對方記你人情。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你私下拆讀再封回。知情是刃，也能割傷自己。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你投入爐火。灰燼裡，江湖少了一條線。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_book_steal",
    title: "護書驚變",
    body: "書僮抱匣狂奔，後方黑衣人追近，匣鎖喀然鬆動。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你原件交還。對方記你人情。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你私下拆讀再封回。知情是刃，也能割傷自己。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你投入爐火。灰燼裡，江湖少了一條線。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_court_spy",
    title: "朝廷眼線",
    body: "茶客袖裡露出腰牌一角，似官差便衣，正在打量你。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你主動說明來歷，花了些打點銀，烏雲散了些。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你易服混出城門。安全第一。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你循線追查，險些中伏，卻摸到關鍵人名。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_prison_break",
    title: "夜半劫牢",
    body: "城外有人招手：幫手撬鎖，事成分銀。遙見牢房燈火。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "crime"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "報官揭露",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你把線索送官。風險轉給公門。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下解決",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你夜半突襲了事。銀子與刀傷一起到手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝沒看見",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你轉身離開。有些黑，你暫時不想碰。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_execute_ground",
    title: "法場圍觀",
    body: "法場外人群嘈雜，犯人呼冤，刀斧手已在磨刀。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你主動說明來歷，花了些打點銀，烏雲散了些。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你易服混出城門。安全第一。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你循線追查，險些中伏，卻摸到關鍵人名。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_orphan_food",
    title: "粥棚孤兒",
    body: "施粥棚前孩子搶勺，大孩欺負小孩，粥涼了一地。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "kind"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "溫柔以待",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你給了食物、傘或耐心。小事一樁，暖意真實。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "教導一招",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你比劃了一式防身。孩子眼睛發亮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "保持界線",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你幫到安全為止，不承諾做不到的事。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_actor_troupe",
    title: "戲班邀角",
    body: "戲班班主看你身法：可願客串打戲？分帳從優。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "art"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "出手相助",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你幫忙解圍。對方拱手相謝，願結文字之交。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "請教門道",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你奉上薄禮請教。琴棋書畫與武學一理，這一課開了竅。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默默旁觀",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你不打擾，只把意境記在心裡。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_storyteller",
    title: "書場評話",
    body: "書場說到英雄斷臂，聽客拍案，忽有人摔碗抗議說錯了。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你捲袖投入。煙塵之後，街坊記住了你的臉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你高聲分工，事半功倍。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你不靠近危險，只把始末看清。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_fortune_teller",
    title: "卦攤半真",
    body: "算命先生拉你：面帶刀兵劫，三日內慎夜行。伸手要銅板。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "認真對待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 8
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 2
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你依言小心。說不清是心安還是心事。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "理性拆解",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你尋物理原因：回音、暗門、機關。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "一笑置之",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你當故事聽完就走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_night_watch",
    title: "打更人驚",
    body: "打更人狂奔敲鑼：北巷進賊了！聲音發顫。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你捲袖投入。煙塵之後，街坊記住了你的臉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你高聲分工，事半功倍。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你不靠近危險，只把始末看清。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_dog_bite",
    title: "惡犬攔路",
    body: "宅院惡犬掙斷鐵鍊，對準過路人狂吠撲來。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前理論。場面平息，有人拍手，也有人記恨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你三言兩語把事圓了，順便得了點謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你當沒看見。江湖很大，不是每件事都該伸手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_horse_bolt",
    title: "驚馬狂奔",
    body: "驚馬拖着空車衝向菜攤，販夫嚇得趴地。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rescue"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "奮力施救",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 4
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你不顧危險救人。事成後哭謝聲不絕。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "呼叫眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你高喊求援，眾人協力。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "量力而行",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你判斷硬衝只會多死人，先穩陣腳。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_well_poison",
    title: "井水異味",
    body: "井水發苦，街坊腹痛，有人懷疑是仇家下藥。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "town"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "挺身幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你捲袖投入。煙塵之後，街坊記住了你的臉。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "組織眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你高聲分工，事半功倍。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠觀記錄",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你不靠近危險，只把始末看清。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_grave_robber",
    title: "盜墓人影",
    body: "月下荒墳有人影彎腰挖掘，土堆旁亮着短燈。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "tomb"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "近前喝止",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你喝止盜掘。對方逃散，你把土堆回原樣。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "暗中跟隨",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你尾隨分成一點封口費。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "遠離是非",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你覺得邪門，繞道離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_mirror_mist",
    title: "鏡湖晨霧",
    body: "湖霧裡傳來對掌聲，兩人影若隱若現，似在比試而非生死。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "duel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "應戰比試",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你應下約戰，交手數招。勝負另說，汗水與刀風倒讓你清醒許多。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以禮化解",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你拱手致意，言明不為意氣。對方一愣，收勢讓路——有時退一步，名望反增。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "繞道而行",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不戀戰，另擇路徑。勝負留給願意逞強的人。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_sandstorm_camp",
    title: "沙暴扎營",
    body: "沙暴將至，商旅爭搶避風石壁，水源只剩一壺。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "travel"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "共享資源",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: 4
              },
              {
                type: "money",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你把乾糧水源分給同行。危難裡結成的善緣更牢靠。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "強佔有利位",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 6
              },
              {
                type: "reputation",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  e: 1
                }
              },
              {
                type: "narrate",
                text: "你搶先佔據安全處。活是活了，目光卻被戳得慌。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "另尋出路",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "attr",
                delta: {
                  danShi: 2
                }
              },
              {
                type: "narrate",
                text: "你不與人爭，另闢蹊徑。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_reed_ambush",
    title: "蘆葦伏兵",
    body: "渡船近岸，蘆葦叢箭矢乍起——有人喊：留下包裹！",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ambush"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻反擊",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -7
              },
              {
                type: "money",
                amount: 5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你反手追擊。刺客逃了，留下標記與散銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "護住弱者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你先把路人推開，自己扛了險。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "低調撤離",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你感到殺意未盡，先離開人群。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_silk_deal",
    title: "絲路交易",
    body: "胡商展示一枚玉扳指：此物可換你腰間短刃，如何？",
    tags: [
      "ordinary",
      "jianghu_extra",
      "trade"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "公平交易",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你等價交換。東西未必神兵，過程卻乾淨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "討價還價",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "world",
                delta: {
                  economy: 1
                }
              },
              {
                type: "narrate",
                text: "你把價格壓下來，也聽了邊地新聞。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕離開",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你覺得不對盤，拱手離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_fake_monk",
    title: "假僧化緣",
    body: "僧人化緣開口索銀十兩，戒疤卻像新燙，眼神發飄。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "street"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義介入",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -4
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "narrate",
                text: "你上前理論。場面平息，有人拍手，也有人記恨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "智慧周旋",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 6
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你三言兩語把事圓了，順便得了點謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "冷眼走過",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你當沒看見。江湖很大，不是每件事都該伸手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_true_hero",
    title: "俠義兩難",
    body: "老人摔倒銅盆滾落；同時遠處孩童幾乎被車撞——只能先顧一端。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "xia"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "救更危者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你衝向更危險的那一端。有人罵你冷血，也有人說你懂輕重。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "救眼前人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你先扶起眼前之人，承受遠處那份遺憾。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "設法兩全",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -6
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你喊人分頭行動，自己中間調度。險勝兩全。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_evil_offer",
    title: "邪功誘餌",
    body: "蒙面人塞給你一頁黑譜：練了七日可加倍掌力……只要心夠狠。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "evil"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "撕毀黑譜",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3,
                  e: -2
                }
              },
              {
                type: "narrate",
                text: "你當面撕碎黑譜。對方冷笑消失。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "收下暗練",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 5
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  e: 3,
                  xia: -2
                }
              },
              {
                type: "narrate",
                text: "你把譜藏進靴筒。功力長了，睡夢卻血腥。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝答應",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 2
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你虛與委蛇，套出他們聚集地。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_kuang_feast",
    title: "狂生夜宴",
    body: "酒樓上有人砸桌狂笑，邀你對飲三十碗：喝不下的，不是英雄。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "kuang"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "喝就喝到底",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 3
                }
              },
              {
                type: "narrate",
                text: "你沒先倒下。狂名傳開，肝卻在抗議。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "以茶代酒",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你聲明以茶代酒論英雄。有人笑，有人敬。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "掀桌離席",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你嫌虛偽，掀桌就走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_xie_whisper",
    title: "邪道耳語",
    body: "暗巷人聲：那家藥鋪後門運的不是藥……是人。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "xie"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線查清",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你像影子跟到後門。知情讓你主動。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣給人",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  xie: 2
                }
              },
              {
                type: "narrate",
                text: "你把消息賣給需要的一方。銀子不辯善惡。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "匿名報官",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你寫了封無名帖。刀不見血，事也可能了。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_xia_escort",
    title: "護送老人",
    body: "老者腳步蹣跚，要去城南掃墓，路上匪患未清。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "xia"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "救更危者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你衝向更危險的那一端。有人罵你冷血，也有人說你懂輕重。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "救眼前人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你先扶起眼前之人，承受遠處那份遺憾。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "設法兩全",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -6
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你喊人分頭行動，自己中間調度。險勝兩全。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_market_fraud",
    title: "假藥攤子",
    body: "攤販賣續命丹，誇得天花亂墜，老婦掏出全部零錢。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你把銀子送到需要的人手裡。袋輕了，心卻沒那麼堵。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你談妥公道，雙方各讓一步，你也得了謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看清行情與人心，沒有出手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_bridge_check",
    title: "官卡盤查",
    body: "官卡攔人核對腰牌，排尾有人塞銀想插隊，差役眼神閃爍。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "court"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "自證清白",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: -5
              },
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "narrate",
                text: "你主動說明來歷，花了些打點銀，烏雲散了些。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "改頭換貌",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你易服混出城門。安全第一。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "追查真兇",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你循線追查，險些中伏，卻摸到關鍵人名。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_river_pack",
    title: "河上浮物",
    body: "河邊發現無人認領的包裹，裡面似有兵器與書信。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystery"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "保全現場",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你不讓人亂翻，只記細節。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下搜證",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你趁亂搜出信物。也許能換賞，也許能換禍。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "盡快離開",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不想當替罪羊，抽身就走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_lantern_riddle",
    title: "燈謎高台",
    body: "元宵燈謎高台懸賞，末一題極難，無人能解。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "festival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "參與湊趣",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你加入熱鬧。笑聲裡，殺氣淡了一夜。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "贏取彩頭",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你應答成功，彩頭到手，也賺了面子。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "邊緣靜看",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你站在燈火外看人海。熱鬧是他們的，安靜是你的。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_dragon_boat",
    title: "龍舟爭渡",
    body: "端午龍舟缺一名掌舵，班主急得團團轉。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "festival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "參與湊趣",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你加入熱鬧。笑聲裡，殺氣淡了一夜。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "贏取彩頭",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你應答成功，彩頭到手，也賺了面子。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "邊緣靜看",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你站在燈火外看人海。熱鬧是他們的，安靜是你的。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_midautumn",
    title: "中秋無月",
    body: "中秋雲遮月，酒肆勸人買醉，角落有人獨酌落淚。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "festival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "參與湊趣",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -5
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你加入熱鬧。笑聲裡，殺氣淡了一夜。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "贏取彩頭",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 12
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你應答成功，彩頭到手，也賺了面子。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "邊緣靜看",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你站在燈火外看人海。熱鬧是他們的，安靜是你的。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_newyear_debt",
    title: "年關逼債",
    body: "年關將至，債主堵門，孩童嚇得哭，灶上冷鍋。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "economy"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "仗義疏財",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -14
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你把銀子送到需要的人手裡。袋輕了，心卻沒那麼堵。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "居間調停",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "money",
                amount: 6
              },
              {
                type: "attr",
                delta: {
                  meiLi: 2
                }
              },
              {
                type: "narrate",
                text: "你談妥公道，雙方各讓一步，你也得了謝禮。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "做壁上觀",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  economy: 1,
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你看清行情與人心，沒有出手。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_spring_outing",
    title: "踏青遇刺",
    body: "踏青路上暗器擦肩，草葉間有人倉皇逃竄，似誤傷。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ambush"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻反擊",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -7
              },
              {
                type: "money",
                amount: 5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你反手追擊。刺客逃了，留下標記與散銀。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "護住弱者",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你先把路人推開，自己扛了險。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "低調撤離",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你感到殺意未盡，先離開人群。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_autumn_hunt",
    title: "秋獵圍場",
    body: "富戶秋獵邀請賓客，獵物卻被人提前放跑，主人震怒。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "hunt"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "協助圍捕",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -5
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你幫忙截獵物。分成公平，箭傷也算學費。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "放走生靈",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你故意嚇跑獵物。主人罵你，你只當沒聽見。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "只做見證",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 2
                }
              },
              {
                type: "narrate",
                text: "你不參賽，只看誰作弊、誰手軟。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_winter_rite",
    title: "冬至祭祖",
    body: "冬至祠堂缺人手上香，長老看你面善，請你代勞一炷。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ritual"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "恭敬行事",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你依禮行事。香煙裊裊，連自己也靜了下來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "出力扛事",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你挽袖出力。禮儀之外，肩膀也很重要。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默哀即可",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你上完香就退到一旁。尊重不必張揚。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_ghost_fest",
    title: "中元河燈",
    body: "中元夜河燈漂流，有一盞燈逆流而回，停在你腳邊。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "認真對待",
        outcomes: [
          {
            effects: [
              {
                type: "qi",
                amount: 8
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 2
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你依言小心。說不清是心安還是心事。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "理性拆解",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 2
                }
              },
              {
                type: "narrate",
                text: "你尋物理原因：回音、暗門、機關。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "一笑置之",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "narrate",
                text: "你當故事聽完就走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_plague_mask",
    title: "瘟疫面紗",
    body: "鎮上有人傳瘟疫，郎中分發藥粉，也有人趁機抬價。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "clinic"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "代付藥金",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -12
              },
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你替人付了藥金。病人哭謝，郎中悄悄少收了你兩成。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "查驗藥方",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你逼問劑量，發現誇大處，雙方各退一步。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "不介入",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "narrate",
                text: "你不是判官，默默離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_mine_collapse",
    title: "礦坑塌方",
    body: "山礦塌方，喊聲從地下傳來，礦主卻攔人：官差未到勿入。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rescue"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "奮力施救",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 4
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 3
                }
              },
              {
                type: "narrate",
                text: "你不顧危險救人。事成後哭謝聲不絕。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "呼叫眾人",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你高喊求援，眾人協力。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "量力而行",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你判斷硬衝只會多死人，先穩陣腳。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_actor_mask",
    title: "戲假情真",
    body: "夜戲散場，花旦摘面具後竟是舊識，眼神示意有事相求。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "friend"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "伸手相助",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你把忙幫了。人情賬記在心裡。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "有條件幫忙",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "narrate",
                text: "你幫一半，留一半作交換。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕",
        outcomes: [
          {
            effects: [
              {
                type: "attr",
                delta: {
                  danShi: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你搖頭。有些忙，幫了會陷進去。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_letter_home",
    title: "家書晚到",
    body: "家書遲到兩月，字跡模糊，只寫母病……速歸……其餘被雨洇。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "family"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "立刻起程",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -10
              },
              {
                type: "health",
                amount: -2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你收拾包袱就走。家書一到，江湖再大也變小。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "先安頓事務",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -4
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你先把手頭事託人，再上路。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "回信探問",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -2
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你先託信使回問詳情。焦急裡仍留冷靜。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_rival_spare",
    title: "宿敵求饒",
    body: "昔日對手跪地：我母病重，此戰求你手下留情。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "rival"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "答應饒恕",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 3,
                  e: -2
                }
              },
              {
                type: "narrate",
                text: "你收刃：去吧。仇未消，卻把刀暫時放下。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "打到認輸",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 3
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "nature",
                delta: {
                  kuang: 2
                }
              },
              {
                type: "narrate",
                text: "你仍要分個高低，只在最後留了餘地。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "要他代價",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 15
              },
              {
                type: "reputation",
                amount: -1
              },
              {
                type: "nature",
                delta: {
                  xie: 2
                }
              },
              {
                type: "narrate",
                text: "你放人，但收下兵器或銀兩作代價。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_master_funeral",
    title: "前輩喪禮",
    body: "一位無關門派的前輩驟逝，喪禮缺人抬棺，路人多袖手。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "ritual"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "恭敬行事",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你依禮行事。香煙裊裊，連自己也靜了下來。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "出力扛事",
        outcomes: [
          {
            effects: [
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "health",
                amount: -3
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "narrate",
                text: "你挽袖出力。禮儀之外，肩膀也很重要。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "默哀即可",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 2
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "narrate",
                text: "你上完香就退到一旁。尊重不必張揚。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_disciple_betray",
    title: "同門反目",
    body: "有人自稱同道，當眾指控你偷學，圍觀者起鬨。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "sect"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "交還密件",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你原件交還。對方記你人情。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "拆讀再決",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你私下拆讀再封回。知情是刃，也能割傷自己。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "燒掉了斷",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你投入爐火。灰燼裡，江湖少了一條線。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_inn_murder",
    title: "客棧命案",
    body: "客棧夜半尖叫，房門內一具屍體，掌櫃要封鎖全樓。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "mystery"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "保全現場",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 1
                }
              },
              {
                type: "attr",
                delta: {
                  wuXing: 1
                }
              },
              {
                type: "world",
                delta: {
                  order: 2
                }
              },
              {
                type: "narrate",
                text: "你不讓人亂翻，只記細節。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下搜證",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 3
                }
              },
              {
                type: "narrate",
                text: "你趁亂搜出信物。也許能換賞，也許能換禍。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "盡快離開",
        outcomes: [
          {
            effects: [
              {
                type: "health",
                amount: 3
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你不想當替罪羊，抽身就走。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_salt_smuggle",
    title: "私鹽過境",
    body: "車隊鹽包渗白，押運者塞銀求你看開些。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "crime"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "報官揭露",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 2
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 3
                }
              },
              {
                type: "narrate",
                text: "你把線索送官。風險轉給公門。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "私下解決",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 16
              },
              {
                type: "martial",
                amount: 2
              },
              {
                type: "health",
                amount: -8
              },
              {
                type: "nature",
                delta: {
                  kuang: 1
                }
              },
              {
                type: "narrate",
                text: "你夜半突襲了事。銀子與刀傷一起到手。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "假裝沒看見",
        outcomes: [
          {
            effects: [
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  danger: 1
                }
              },
              {
                type: "narrate",
                text: "你轉身離開。有些黑，你暫時不想碰。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_tea_horse",
    title: "茶馬互市",
    body: "邊市茶馬交換吵翻，譯者被推搡，交易眼看破裂。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "trade"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "公平交易",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: -8
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "reputation",
                amount: 1
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "narrate",
                text: "你等價交換。東西未必神兵，過程卻乾淨。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "討價還價",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 10
              },
              {
                type: "attr",
                delta: {
                  meiLi: 1
                }
              },
              {
                type: "world",
                delta: {
                  economy: 1
                }
              },
              {
                type: "narrate",
                text: "你把價格壓下來，也聽了邊地新聞。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "拒絕離開",
        outcomes: [
          {
            effects: [
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你覺得不對盤，拱手離開。"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "jx_pearl_dive",
    title: "寒潭摸蚌",
    body: "漁人說潭底有珠蚌，水深且寒，上去者分紅。",
    tags: [
      "ordinary",
      "jianghu_extra",
      "treasure"
    ],
    weight: 11,
    requirements: {
      minAge: 14
    },
    choices: [
      {
        id: "a",
        text: "跟線探索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 14
              },
              {
                type: "martial",
                amount: 1
              },
              {
                type: "health",
                amount: -6
              },
              {
                type: "attr",
                delta: {
                  fuYuan: 1
                }
              },
              {
                type: "narrate",
                text: "你依線找到舊處。無金山，卻有散銀與銹劍。"
              }
            ]
          }
        ]
      },
      {
        id: "b",
        text: "賣掉線索",
        outcomes: [
          {
            effects: [
              {
                type: "money",
                amount: 20
              },
              {
                type: "nature",
                delta: {
                  xie: 1
                }
              },
              {
                type: "world",
                delta: {
                  rumors: 1
                }
              },
              {
                type: "narrate",
                text: "你把線索賣給牙行。銀子爽快，夜裡卻有點空。"
              }
            ]
          }
        ]
      },
      {
        id: "c",
        text: "公開於眾",
        outcomes: [
          {
            effects: [
              {
                type: "reputation",
                amount: 3
              },
              {
                type: "nature",
                delta: {
                  xia: 2
                }
              },
              {
                type: "world",
                delta: {
                  order: 1
                }
              },
              {
                type: "narrate",
                text: "你把線索交公議，免得惹出血案。"
              }
            ]
          }
        ]
      }
    ]
  }
];

function badStory(_choiceId: string, choiceText?: string): string {
  const act = choiceText ?? '此舉';
  return `你本欲「${act}」，卻橫生枝節：人或走避，事或生變，銀錢與氣血都捱了一記。你把教訓嚥下，再上路。`;
}

export const JIANGHU_EXTRA_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    (id, text) => [
      { type: 'narrate', text: badStory(id, text) },
      { type: 'health', amount: -10 },
      { type: 'money', amount: -5 },
    ],
    0.15,
  ),
);
