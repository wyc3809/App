import { getRng } from '@core/random';

/**
 * 手寫句庫 + 禁詞：避開 LLM 套話腔（局面鬆動／終究／立誓…）
 * 句式短、寫可見細節，少抽象「命運／機緣」。
 */

const AI_SLOP =
  /局面鬆動|終究沒空手|終究沒有空手|有得有失|立誓下回|像棋盤上多落了一子|關鍵一句|半頁密帳|可核對的抄件|可核對的抄本|銀錢、氣血或顏面|改日再圖|這一局要用真功夫/g;

export function scrubAiSlop(text: string): string {
  let s = String(text ?? '').trim();
  if (!s) return s;
  s = s.replace(AI_SLOP, '');
  s = s.replace(/[，、]\s*[，、]/g, '，').replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/^[，、。．\s]+|[，、\s]+$/g, '');
  return s;
}

function pick(lines: string[]): string {
  return getRng().pick(lines);
}

function withAct(template: string, act: string): string {
  return scrubAiSlop(template.replace(/\{act\}/g, act));
}

/** 修煉／運功／淬體／鍛造 */
export const PRACTICE_FAIR = [
  '「{act}」坐了一炷香。檐下雨剛停，袖口還是潮的。',
  '「{act}」時窗外有人喊賣豆腐。你沒睜眼，把那聲喊也練了進去。',
  '「{act}」收功，膝下青磚涼了一層。燈花爆了一下。',
  '「{act}」到後來只聽見自己的呼吸。壺裡的水早涼了。',
  '「{act}」完，你站起來，腿麻得發木——算是練過了。',
  '「{act}」半晌，壁上舊劍影動了動。原來是風。',
  '「{act}」後你漱了口。舌尖有一點铁锈味，不知從哪來。',
  '「{act}」時貓從院牆跳過。你眨了眨眼，又把心收回來。',
  '「{act}」到汗濕後心，你才停。天井裡月光薄得像紙。',
  '「{act}」罷，炭盆只剩白灰。你撥了撥，沒再加炭。',
];

export const PRACTICE_MIXED = [
  '「{act}」做到一半，隔壁砸了碗。內息一滯，只好提前散功。',
  '「{act}」時腿麻得厲害，你換了個坐姿，進境便淺了。',
  '「{act}」剛有點意思，蒼蠅叮在鼻尖。一拍，全散了。',
  '「{act}」中途口乾，起身倒水。回來再坐，總差一口氣。',
  '「{act}」時想起舊賬，心猿一跳，只好收功揉眉心。',
  '「{act}」未完，更鼓響了。你數了數，原來已過兩個時辰，卻像沒練夠。',
  '「{act}」時雨打竹葉太密。你聽進去了，功法反倒聽不見。',
  '「{act}」半途刀疤隱隱作痛。你沒硬撐，今日到此為止。',
];

export const PRACTICE_ILL = [
  '「{act}」岔了氣，胸口悶了一陣。躺到天亮，什麼都沒長進。',
  '「{act}」時強行催勁，耳鳴如潮。你捂着額角，今夜不敢再試。',
  '「{act}」坐歪了——起來時肩酸得抬不起劍。白耗一夜。',
  '「{act}」中忽然想起死人的臉。冷汗下來，功也散了。',
  '「{act}」未半，嘔吐了一回。藥渣味還在喉嚨，修為半點沒動。',
  '「{act}」時走神，掌緣磕在爐沿。血珠滾進灰裏，今夜只好作罷。',
];

/** 交手／硬闖 */
export const COMBAT_FAIR = [
  '「{act}」時對方退了半步。你袖口破了，血很少。',
  '「{act}」得手。巷口的狗叫了兩聲，又停了。',
  '「{act}」過後，你在牆根蹲着喘气。刀還是熱的。',
  '「{act}」逼退來人。磚縫裏卡着半片布，不是你的。',
  '「{act}」後雨開始下。血被沖淡，石階卻更滑。',
  '「{act}」了了。你數了數手指，還齊。',
];

export const COMBAT_MIXED = [
  '「{act}」換來一句話，也換來肩膀一下。血滲進衣裏，黏黏的。',
  '「{act}」時踢翻了醬缸。人跑了，你鞋裏全是醬油。',
  '「{act}」壓住對方手腕。他自己咬破了舌，噴了你一臉。',
  '「{act}」贏了半招。膝頭磕青，走路有點彆。',
  '「{act}」後你們各自退開。他丟下一枚銅錢，你沒撿。',
  '「{act}」扯破了他的面巾。底下是張生臉——你反倒愣了愣。',
];

export const COMBAT_ILL = [
  '「{act}」踢到鐵板。短棍砸肩，你退進雨裏，只記得對方腕上的疤。',
  '「{act}」還沒看清人，後腦挨了一下。醒來時錢包輕了。',
  '「{act}」被逼到死角。門後還有人。你丟了刀，換了一條命。',
  '「{act}」落空。對方笑了一聲，刀背抽在你小腿上。',
  '「{act}」不成。你爬進柴垛，聽着靴聲遠去，牙關還在發抖。',
  '「{act}」時燈被人打滅。亂棍裏你只護住了頭。',
];

/** 市井／人情 */
export const SOCIAL_FAIR = [
  '你做了「{act}」。櫃上少了兩許銀，對方點了點頭，把地址寫在你手心。',
  '「{act}」之後，茶涼了半杯。需要的名字，已經記下。',
  '靠「{act}」問到了。巷口有人看你，你低了低頭走。',
  '「{act}」辦妥。紙角被茶水洇開，字還認得出。',
  '你「{act}」。對方沒多話，只把一枚舊簪推過桌來。',
  '「{act}」時沒人攔。你走出門，才發現後背汗濕了。',
  '「{act}」成了。燈籠搖了一下，影裏有人轉身離開。',
  '你按「{act}」去做。事主擦了擦眼，說了聲謝。',
];

export const SOCIAL_MIXED = [
  '「{act}」問到半截。要緊處被人岔開，你只得了個大概。',
  '你為「{act}」貼了力氣。人護住了，自己口袋空了一截。',
  '「{act}」讓你進了門，也讓跑堂多看了你兩眼。',
  '「{act}」時雨忽然大。話沒說完，雙方各自撑傘走了。',
  '你「{act}」。得到一句真話，也留下一個把柄。',
  '「{act}」半成。名冊抄到一半，最末一行被人撕走。',
  '「{act}」換來方向。走到路口，才發現路牌是新換的。',
  '你做了「{act}」。銀兩少了，耳根也熱了——閒話跟了一程。',
];

export const SOCIAL_ILL = [
  '「{act}」沒問着。門關了，裏面有人笑。',
  '你執意「{act}」。人被拖走，差役還收了你一筆「滋事」銀。',
  '「{act}」被看穿。你退到廊下，鞋底還沾着剛才的酒。',
  '「{act}」太乾淨。事主被拖走時說：「早知不該信你。」',
  '「{act}」談崩了。茶杯碎在桌上，你付了銀子出門。',
  '你「{act}」。對方把信燒了，灰落進你袖口。',
  '「{act}」不成。你在雨裏站了片刻，決定今晚不回家那個方向。',
  '「{act}」換來一頓毒打。醒来時天快亮，牙鬆了一顆。',
];

/** 靜月／無事 */
export const QUIET_MONTH = [
  '雨歇。無甚事。',
  '院牆外有人練拳，到午就停了。',
  '茶淡。你坐到天黑。',
  '這個月的信，都是賬單。',
  '門前槐花落了一層。你掃了，又落。',
  '夜長。夢短。醒時爐灰白。',
  '鎮上演社戲，你聽了半出就走。',
  '刀石磨了又磨。火星很少。',
  '有人來訪，見你打坐，留了張帖子便去。',
  '這個月你把舊傷的藥換了一帖。',
  '河面結了薄冰，又化了。',
  '你數了數銀兩，又把匣子蓋上。',
];

export function narratePractice(kind: 'fair' | 'mixed' | 'ill', act: string): string {
  const pool = kind === 'fair' ? PRACTICE_FAIR : kind === 'mixed' ? PRACTICE_MIXED : PRACTICE_ILL;
  return withAct(pick(pool), act);
}

export function narrateCombat(kind: 'fair' | 'mixed' | 'ill', act: string): string {
  const pool = kind === 'fair' ? COMBAT_FAIR : kind === 'mixed' ? COMBAT_MIXED : COMBAT_ILL;
  return withAct(pick(pool), act);
}

export function narrateSocial(kind: 'fair' | 'mixed' | 'ill', act: string): string {
  const pool = kind === 'fair' ? SOCIAL_FAIR : kind === 'mixed' ? SOCIAL_MIXED : SOCIAL_ILL;
  return withAct(pick(pool), act);
}

export function quietMonthLine(year: number, month: number, season: string): string {
  return scrubAiSlop(`${year}年${month}月（${season}）。${pick(QUIET_MONTH)}`);
}
