/**
 * 高頻／模板敘事覆蓋：key = `${eventId}::${choiceId}`
 * 結算時替換空洞「就「…」一事」模板，不改原 catalog 檔案 bulk。
 */
export const NARRATE_OVERRIDES: Record<string, string> = {
  'find_coin::keep': '銅錢入手，掌心一涼。你環顧左右，街口無人喚失，便把錢貼身收好——江湖第一課，往往從「這算不算偷」開始。',
  'find_coin::return': '你追上去，把銅錢塞回那人手裡。對方一愣，連聲道謝。巷口風過，你覺得胸口輕了一寸。',
  'master_wanderer::learn': '遊方道人看你一眼，袖裡抖出半卷殘篇：「緣到便傳。」晨霧未散，你已記得三式吐納。',
  'master_wanderer::ignore': '你拱手退去。道人也不強留，只把葫蘆一晃，消失在鎮外官道的楊塵裡。',
  'sect_recruit::join': '門中人遞過一枚冷鐵腰牌。你按手印時，遠山如墨——從此腳下這條路，有了門牆。',
  'sect_recruit::decline': '你婉拒門中之邀。來人也不惱，只道：「江湖很大，門牆很小。他日若改了主意，山門還在。」',
  'sect_training::hard': '晨練到肘臂發顫，教習才喝停。汗滴在青石上，像一行寫不完的字。',
  'sect_training::rest': '你偷得半日清閒，聽師兄師姐閒話門中舊事。力氣沒長，耳聞卻多了。',
  'learn_sword::study': '劍譜上的圈點漸漸被你讀懂。出招時風聲變了——不是更快，是更準。',
  'learn_sword::sell': '你把譜本易了銀兩。銀子沉甸甸，心底卻像缺了一角。',
  'love_meet::talk': '你們在橋邊說了很久。河燈一盞盞漂過，誰也沒問「明日還見不見」。',
  'love_meet::shy': '你低眉過去，對方似笑非笑。有些話卡在喉嚨，反而比說出來更長久。',
  'love_confess::yes': '你把心事攤開。對方眼裡有光，也有猶豫，終究伸手回握——江湖路遠，兩人近了一步。',
  'love_confess::wait': '你把話嚥回去。月色很好，時機卻還不到。',
  'duel_street::fight': '街沿圍觀的人讓出一圈。刀光過處，塵土飛起——這一架，不只為輸贏，也為臉面。',
  'duel_street::flee': '你抽身退入人潮。背後有嘲笑，也有鬆一口氣的聲音——活著，才有下一頁。',
  'bandit_raid::defend': '鑼聲亂響，你提起兵刃擋在巷口。火光裡人影幢幢，鎮裡人的哭喊像潮水。',
  'bandit_raid::hide': '你把家人推進地窖，自己屏息聽著外頭的馬蹄。有些勇敢，是先保住火種。',
  'wealth_trade::invest': '你把銀兩押進貨船。掌櫃拍胸脯，你卻只看見江面上的霧——賺與賠，都在霧裡。',
  'wealth_trade::pass': '你搖頭不入股。船走了，岸上的你口袋輕，心事也輕。',
  'plague::aid': '藥香與苦汗混在一起。你幫著抬水、送藥，直到手指發白——名望是別人給的，疲憊是自己的。',
  'plague::flee_city': '你連夜出城。回頭時，鎮燈稀疏，像一雙眼慢慢閉上。',
  'martial_tournament::enter': '號炮響，你踏進比武場。喝彩與起鬨同時砸來——這一刻，只剩呼吸與步法。',
  'martial_tournament::watch': '你站在場邊看完三場。有人贏得很醜，有人輸得很漂亮。你把這些都記進袖裡。',
  'inner_power::breakthrough': '丹田一熱，氣脈像江河決口。你睜眼時，窗外的鳥叫都清晰了半分。',
  'betray_sect::explain': '你把來龍去脈說盡。長老沉默良久，只嘆：「人心比刀難防。」',
  'betray_sect::leave': '你摘下腰牌，放在山門石上。身後鐘聲一記，像替這段門緣蓋印。',
  'elder_task::accept': '你領了差事下山。信封不重，責任卻沉。',
  'elder_task::refuse': '你推了這趟差。門中人看你的眼神淡了些，路卻仍是你的路。',
  'rival_challenge::duel': '帖子遞到面前，墨跡未乾。你應了——有些帳，不宜拖到白頭。',
  'treasure_map::dig': '月下掘土，鏟刃碰到硬物。你屏息撬開——裡面未必是寶，卻一定是選擇。',
  'wine_poet::recite': '你拍案而起，把胸中那幾句吼完。酒客叫好，詩人不置可否，只再滿上一碗。',
  'wine_poet::drink': '你與詩人對飲到更殘。醉意裡江湖變近，明天的路變遠。',
  'assassin::fight': '殺機起於呼吸之間。你側身出招，窄巷容不下兩個活口同時從容。',
  'assassin::escape': '你踏屋脊而去。身後衣袂割風，像有人在暗處咬牙。',
  'parent_ill::care': '榻前燈芯跳了又跳。你徹夜換巾、喂藥，直到窗外魚肚白。',
  'parent_ill::doctor': '你奔去請醫。銀兩少了一截，心裡那塊石頭卻鬆了。',
  'war_draft::serve': '兵符到手，你跟著隊列出鎮。塵土揚起，千燈的燈火被甩在背後。',
  'war_draft::bribe': '你塞了銀子給差役。隊伍走了，你站在空街上，說不清是慶幸還是羞慚。',
  'inn_brawl::join': '酒碗砸碎的瞬間你已出手。店小二哭喊著算帳，你卻笑出了聲——有時候，熱鬧也是修行。',
  'inn_brawl::mediate': '你橫身勸開兩邊。拳头停了，目光卻還燙。你把這場架按回座位裡。',
  'secret_manual::read': '殘頁字跡古怪，你硬生生讀進去。天亮時眼眶發乾，拳意卻多了一層。',
  'gamble::play': '骰子滾停。你盯著點數，耳邊全是別人的呼吸——運氣這東西，最會騙人。',
  'gamble::quit': '你把籌碼推回去。有人笑你怯，你只覺口袋裡的銀子還認得主人。',
  'rescue_child::save': '你衝進水裡／火裡（記不清了），懷裡小孩哭得撕心。上岸後，鎮人讓出一條路。',
  'herb_gather::go': '山徑露重。你按圖索草，手指沾了苦香——有些藥，要拿命換的小心去采。',
  'sect_promotion::trial': '考核場上無人言語。你打完一套，跪地平息，聽長老只道一個字：「可。」',
  'love_rival::confront': '你拦下那人，把話說開。刀可以收，話卻不能含糊。',
  'love_rival::trust': '你選擇相信。有些裂縫，要用時間補，不是用拳頭。',
  'monk_alms::give': '你把銅錢放進缽裡。和尚點頭，並不謝——布施本來就不是為了被謝。',
  'monk_alms::listen': '你聽完一席因果。未必全信，卻記得一句：「刀快不如心穩。」',
  'blacksmith::buy': '新兵刃上手，沉甸甸的。爐火映紅半邊臉，你覺得自己又硬了一寸。',
  'blacksmith::apprentice': '你留下來拉風箱。鐵屑進了指甲縫，師傅只丟來一句：「先學會忍熱。」',
  'court_summon::serve_court': '公門文書蓋了印。你踏進另一種江湖——沒有刀光，卻一樣見血。',
  'court_summon::decline_court': '你辭了差事。官道外的風更自由，口袋也更空。',
  'jianghu_rumor::investigate': '你請一碗茶，換三句話。茶涼了，風聲卻熱起來——追查的路上，刀與銀往往結伴。',
  'jianghu_rumor::ignore_rumor': '你一笑置之。有些傳聞聽了就會變成路，你偏要站在原地。',
  'poison_test::taste': '藥氣衝鼻。你咬牙試了一口，世界在舌尖轉了一圈——活下來，便是答案。',
  'poison_test::send': '你讓弟子先試。門中安靜得可怕；有些便宜，日後都要連本帶利還。',
};

export function overrideKey(eventId: string, choiceId: string): string {
  return `${eventId}::${choiceId}`;
}

export function lookupNarrateOverride(eventId: string, choiceId: string): string | undefined {
  return NARRATE_OVERRIDES[overrideKey(eventId, choiceId)];
}

/** 套用覆蓋到效果列表中的第一條 narrate */
export function applyNarrateOverrideToEffects(
  eventId: string,
  choiceId: string,
  effects: import('@interfaces/lifeEngine').GameEffect[],
): import('@interfaces/lifeEngine').GameEffect[] {
  const text = lookupNarrateOverride(eventId, choiceId);
  if (!text) return effects;
  let replaced = false;
  return effects.map((eff) => {
    if (!replaced && eff.type === 'narrate') {
      replaced = true;
      return { ...eff, text };
    }
    return eff;
  });
}

export function isTemplateNarrate(text: string): boolean {
  return /就「.+」一事，你選擇「.+」/.test(text) || /這段經過像一頁墨跡/.test(text);
}
