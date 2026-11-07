// 和暦よみの問題を作る（ブラウザと node の両方で使う）。
// 1問 = 和暦と西暦の読みかえ・満年齢・十干十二支の並びを4つから選ぶ。
// 元号の始まりは、元号を改める政令（平成・令和、e-Gov）と国立公文書館の改元の詔書の解説（大正・昭和）、明治元年＝1868年は国立公文書館で確かめた。
// 年齢は年齢計算ニ関スル法律（出生の日から数える）。十干・十二支の並びと読みは国立天文台「六十干支」。
// 年と干支の対応（2026年は○○年など）は公的な出典で確かめられなかったので出さない。並び（次は何か・N年後は何か）だけを出す。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ種なら、どの端末でも同じ問題になる。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const SRC = {
    H: ["e-Gov 法令検索 元号を改める政令（昭和64年政令第1号・平成）", "https://laws.e-gov.go.jp/law/364CO0000000001"],
    R: ["e-Gov 法令検索 元号を改める政令（平成31年政令第143号・令和）", "https://laws.e-gov.go.jp/law/431CO0000000143"],
    T: ["国立公文書館 日本のあゆみ「大正と改元」（明治45年7月30日）", "https://www.archives.go.jp/ayumi/kobetsu/m45_1912_01.html"],
    S: ["国立公文書館 日本のあゆみ「昭和と改元」（大正15年12月25日）", "https://www.archives.go.jp/ayumi/kobetsu/t15_1926_01.html"],
    M: ["国立公文書館 日本のあゆみ「鳥羽・伏見の戦い」（明治元年＝1868年）", "https://www.archives.go.jp/ayumi/kobetsu/m01_1868_01.html"],
    A: ["e-Gov 法令検索 年齢計算ニ関スル法律（明治35年法律第50号）", "https://laws.e-gov.go.jp/law/135AC1000000050"],
    K: ["国立天文台 暦計算室「六十干支」", "https://eco.mtk.nao.ac.jp/koyomi/faq/60kansi.html"],
  };

  const pickN = (R, arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const shuffle = (R, arr) => pickN(R, arr, arr.length);
  const one = (R, arr) => arr[Math.floor(R() * arr.length)];
  const int = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  function opts(R, ans, wrongs, n = 4) {
    const out = [];
    for (const w of wrongs) { if (w && w !== ans && !out.includes(w)) out.push(w); if (out.length === n - 1) break; }
    return shuffle(R, [ans, ...out]);
  }

  // ---- 元号：[名前, 元年の西暦, 始まりの日（月・日）, 最後の年（続いた年数）, 出典] ----
  // 令和はいまの元号なので最後の年は無い（問題では令和12年までを使う）
  const ERAS = [
    { name: "明治", y0: 1868, start: null, last: 45, src: "M" },
    { name: "大正", y0: 1912, start: [7, 30], last: 15, src: "T" },
    { name: "昭和", y0: 1926, start: [12, 25], last: 64, src: "S" },
    { name: "平成", y0: 1989, start: [1, 8], last: 31, src: "H" },
    { name: "令和", y0: 2019, start: [5, 1], last: null, src: "R" },
  ];
  const ERA = Object.fromEntries(ERAS.map((e, i) => [e.name, { ...e, i }]));
  const REIWA_MAX = 12;
  const lastOf = (e) => (e.last == null ? REIWA_MAX : e.last);
  const nen = (n) => (n === 1 ? "元年" : `${n}年`);
  const wa = (e, n) => `${e}${nen(n)}`;
  const toY = (e, n) => ERA[e].y0 + n - 1;
  // 西暦の日付（年・月・日）→ 和暦 [元号, 年]。改元の日から新しい元号（明治より前は null）
  function wareki(y, m, d) {
    for (let i = ERAS.length - 1; i >= 0; i--) {
      const e = ERAS[i];
      if (y > e.y0 || (y === e.y0 && (!e.start || m > e.start[0] || (m === e.start[0] && d >= e.start[1])))) return [e.name, y - e.y0 + 1];
    }
    return null;
  }
  // 改元のあった年（1年に2つの元号がある年）。年だけで和暦に直す問題には出さない
  const SPLIT = ERAS.filter((e) => e.start).map((e) => e.y0);
  const yearOnly = (y) => (SPLIT.includes(y) ? null : wareki(y, 6, 30));

  // ---- 十干・十二支（国立天文台）----
  const KAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const KAN_R = ["きのえ", "きのと", "ひのえ", "ひのと", "つちのえ", "つちのと", "かのえ", "かのと", "みずのえ", "みずのと"];
  const SHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const SHI_R = ["ね", "うし", "とら", "う", "たつ", "み", "うま", "ひつじ", "さる", "とり", "いぬ", "い"];
  const KANSHI = [...Array(60)].map((_, i) => KAN[i % 10] + SHI[i % 12]);
  const KANSHI_R = [...Array(60)].map((_, i) => KAN_R[i % 10] + SHI_R[i % 12]);
  const shiW = (i) => `${SHI[((i % 12) + 12) % 12]}（${SHI_R[((i % 12) + 12) % 12]}）`;

  // 満年齢：年齢は出生の日から数える。誕生日の前日・当日はあいまいにならないよう問題に出さない（2日以上はなす）
  const age = (by, bm, bd, y, m, d) => y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
  const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const dayOfYear = (m, d) => DIM.slice(0, m - 1).reduce((a, b) => a + b, 0) + d;

  // 1問ずつの作り方
  const KINDS = [
    // ===== やさしい =====
    { id: "w2s", lv: 0, cat: "和暦", name: "和暦を西暦に", look: "元年の西暦に「年−1」を足します。昭和元年＝1926年、平成元年＝1989年、令和元年＝2019年。",
      note: "和暦→西暦は、元年の西暦＋（年−1）。昭和元年1926・平成元年1989・令和元年2019。昭和は＋1925、平成は＋1988、令和は＋2018。",
      make(R) {
        const e = one(R, ["昭和", "昭和", "平成", "平成", "令和", "大正"]), n = int(R, 1, lastOf(ERA[e])), y = toY(e, n), a = `${y}年`;
        const ws = shuffle(R, [y + 1, y - 1, y + 10, y - 10, ...ERAS.filter((x) => x.name !== e).map((x) => x.y0 + n - 1)]).map((v) => `${v}年`);
        return { scene: "書類の日付を西暦で書きたい。", show: wa(e, n), ask: "西暦では何年？", ans: a, opts: opts(R, a, ws), chk: { t: "w2s", e, n },
          why: `${e}元年は${ERA[e].y0}年なので、${wa(e, n)}は${ERA[e].y0}＋${n - 1}＝${y}年です。`, src: ERA[e].src };
      } },
    { id: "s2w", lv: 0, cat: "和暦", name: "西暦を和暦に", look: "1989〜2018年は平成、2019年からは令和、1926〜1988年は昭和（改元の年は月日で変わる）。",
      note: "西暦→和暦は、その元号の元年の西暦を引いて1を足す。1995年＝1995−1989＋1＝平成7年。",
      make(R) {
        let y, w; do { y = one(R, [int(R, 1927, 1988), int(R, 1990, 2018), int(R, 2020, 2030), int(R, 1913, 1925)]); w = yearOnly(y); } while (!w);
        const [e, n] = w, a = wa(e, n), i = ERA[e].i;
        const ws = shuffle(R, [wa(e, n + 1), n > 1 ? wa(e, n - 1) : null, wa(e, n + 10), n > 10 ? wa(e, n - 10) : null, ...ERAS.filter((x, j) => j !== i && n <= lastOf(x)).map((x) => wa(x.name, n))]);
        return { scene: "西暦で書かれた年を、和暦で言いたい。", show: `${y}年`, ask: "和暦では？", ans: a, opts: opts(R, a, ws), chk: { t: "s2w", y },
          why: `${e}元年は${ERA[e].y0}年。${y}−${ERA[e].y0}＋1＝${n}なので${a}です。`, src: ERA[e].src };
      } },
    { id: "order", lv: 0, cat: "元号", name: "元号の順番", look: "明治→大正→昭和→平成→令和の順です。",
      note: "近い元号の順：明治（1868〜）→大正（1912〜）→昭和（1926〜）→平成（1989〜）→令和（2019〜）。",
      make(R) {
        const i = int(R, 0, 3), nx = one(R, [true, false]), a = nx ? ERAS[i + 1].name : ERAS[i].name, base = nx ? ERAS[i].name : ERAS[i + 1].name;
        return { scene: "元号の並びを思い出す。", show: nx ? `${base} → ？` : `？ → ${base}`, ask: nx ? `${base}の次の元号は？` : `${base}の前の元号は？`, ans: a,
          opts: opts(R, a, shuffle(R, ERAS.map((x) => x.name).filter((x) => x !== base))), chk: { t: "order", base, nx },
          why: `明治→大正→昭和→平成→令和の順なので、${a}です。`, src: ERAS[i + 1].src };
      } },
    { id: "shinext", lv: 0, cat: "十二支", name: "十二支の次", look: "子・丑・寅・卯・辰・巳・午・未・申・酉・戌・亥（ね・うし・とら・う・たつ・み…）の順です。",
      note: "十二支：子（ね）丑（うし）寅（とら）卯（う）辰（たつ）巳（み）午（うま）未（ひつじ）申（さる）酉（とり）戌（いぬ）亥（い）。亥の次は子にもどる。",
      make(R) {
        const i = int(R, 0, 11), a = shiW(i + 3);
        return { scene: "十二支の並びを思い出す。", show: `${shiW(i)}・${shiW(i + 1)}・${shiW(i + 2)}・？`, ask: "次は？", ans: a,
          opts: opts(R, a, shuffle(R, [shiW(i + 4), shiW(i + 2), shiW(i + 5), shiW(i + 1), shiW(i + 6)])), chk: { t: "shinext", i },
          why: `十二支は子・丑・寅・卯・辰・巳・午・未・申・酉・戌・亥の順。${SHI[(i + 2) % 12]}の次は${a}です。`, src: "K" };
      } },
    { id: "shiread", lv: 0, cat: "十二支", name: "十二支の読み", look: "子＝ね、丑＝うし、寅＝とら、卯＝う、辰＝たつ、巳＝み…と動物の名前で読みます。",
      note: "十二支の読み：子＝ね、丑＝うし、寅＝とら、卯＝う、辰＝たつ、巳＝み、午＝うま、未＝ひつじ、申＝さる、酉＝とり、戌＝いぬ、亥＝い。",
      make(R) {
        const i = int(R, 0, 11), a = SHI_R[i];
        return { scene: "年賀状で十二支の字を見た。", show: SHI[i], ask: "何と読む？", ans: a, opts: opts(R, a, shuffle(R, SHI_R.filter((_, j) => j !== i))), chk: { t: "shiread", i },
          why: `「${SHI[i]}」は「${a}」と読みます（十二支の${i + 1}番目）。`, src: "K" };
      } },

    // ===== ふつう =====
    { id: "age", lv: 1, cat: "年齢", name: "満年齢", look: "今年−生まれた年。誕生日がまだなら、そこから1を引きます。",
      note: "満年齢＝今年の西暦−生まれた年の西暦。今年の誕生日がまだ来ていなければ1を引く（年齢は生まれた日から数える）。",
      make(R) {
        const e = one(R, ["昭和", "昭和", "平成", "平成", "昭和"]), n = int(R, 2, lastOf(ERA[e]) - 1), by = toY(e, n), y = int(R, 2025, 2030), past = one(R, [true, false]);
        const a0 = y - by - (past ? 0 : 1), a = `${a0}歳`;
        return { scene: `${wa(e, n)}生まれの人。${y}年の誕生日を${past ? "もう過ぎた" : "まだむかえていない"}。`, show: `${wa(e, n)} → ${y}年`, ask: "いま何歳？", ans: a,
          opts: opts(R, a, shuffle(R, [a0 + 1, a0 - 1, a0 + 2, a0 - 2]).map((v) => `${v}歳`)), chk: { t: "age", e, n, y, past },
          why: `${wa(e, n)}は${by}年。${y}−${by}＝${y - by}${past ? "。誕生日を過ぎたので" : "。誕生日がまだなので1を引いて"}${a}です。`, src: "A" };
      } },
    { id: "diff", lv: 1, cat: "和暦", name: "何年たった？", look: "どちらも西暦に直してから引きます。元号をまたぐときに気をつけます。",
      note: "元号をまたぐ年数は、両方を西暦に直して引く。平成5年（1993）から令和3年（2021）までは28年。",
      make(R) {
        let e1, n1, e2, n2, y1, y2;
        do { e1 = one(R, ["昭和", "平成"]); n1 = int(R, 1, lastOf(ERA[e1])); e2 = one(R, ["平成", "令和"]); n2 = int(R, 1, lastOf(ERA[e2])); y1 = toY(e1, n1); y2 = toY(e2, n2); } while (e1 === e2 || y2 - y1 < 3);
        const d = y2 - y1, a = `${d}年`;
        return { scene: "2つの出来事の間が何年あいているか数える。", show: `${wa(e1, n1)} → ${wa(e2, n2)}`, ask: "何年たった？", ans: a,
          opts: opts(R, a, shuffle(R, [d + 1, d - 1, Math.abs(n2 - n1), d + 10, d - 10].filter((v) => v > 0)).map((v) => `${v}年`)), chk: { t: "diff", e1, n1, e2, n2 },
          why: `${wa(e1, n1)}は${y1}年、${wa(e2, n2)}は${y2}年。${y2}−${y1}＝${a}です。`, src: ERA[e2].src };
      } },
    { id: "kanread", lv: 1, cat: "十干", name: "十干の読み", look: "十干は「き・ひ・つち・か・みず」に「え・と」を付けて読みます（甲＝きのえ、乙＝きのと）。",
      note: "十干：甲（きのえ）乙（きのと）丙（ひのえ）丁（ひのと）戊（つちのえ）己（つちのと）庚（かのえ）辛（かのと）壬（みずのえ）癸（みずのと）。",
      make(R) {
        const i = int(R, 0, 9), a = KAN_R[i], near = [i ^ 1, (i + 2) % 10, (i + 8) % 10, (i + 3) % 10, (i + 4) % 10].map((j) => KAN_R[j]);
        return { scene: "暦の本で十干の字を見た。", show: KAN[i], ask: "何と読む？", ans: a, opts: opts(R, a, shuffle(R, near)), chk: { t: "kanread", i },
          why: `「${KAN[i]}」は十干の${i + 1}番目で「${a}」と読みます。`, src: "K" };
      } },
    { id: "shiafter", lv: 1, cat: "十二支", name: "何年後の十二支", look: "十二支は12年でひと回り。年数を12でわった余りだけ進めます。",
      note: "十二支は12年でひと回りする。N年後の十二支は、N を12でわった余りの数だけ先へ進める。",
      make(R) {
        const i = int(R, 0, 11), k = one(R, [1, 2, 3, 5, 6, 9, 11, 12, 13, 18, 24, 25, 30, 36, 48]), a = shiW(i + k);
        return { scene: `今年が${shiW(i)}年だとする。`, show: `${SHI[i]} ＋ ${k}年`, ask: `${k}年後は何どし？`, ans: a,
          opts: opts(R, a, shuffle(R, [shiW(i + k + 1), shiW(i + k - 1), shiW(i + k + 2), shiW(i + 12 - (k % 12)), shiW(i + k + 6)])), chk: { t: "shiafter", i, k },
          why: `${k}を12でわると余り${k % 12}。${SHI[i]}から${k % 12}つ進めて${a}です。`, src: "K" };
      } },
    { id: "eralen", lv: 1, cat: "元号", name: "元号は何年まで", look: "明治45年・大正15年・昭和64年・平成31年まで。改元の年は、新しい元号の元年でもあります。",
      note: "それぞれの元号の最後の年：明治45年（1912）・大正15年（1926）・昭和64年（1989）・平成31年（2019）。その年は新しい元号の元年でもあるので、翌年は新しい元号の2年。",
      make(R) {
        const e = one(R, ERAS.filter((x) => x.last)), nx = ERAS[ERA[e.name].i + 1], two = R() < 0.5;
        if (two) {
          const a = wa(nx.name, 2);
          return { scene: `${e.name}${e.last}年の、次の年。`, show: `${e.name}${e.last}年 ＋ 1年`, ask: "和暦では？", ans: a,
            opts: opts(R, a, shuffle(R, [wa(nx.name, 1), wa(e.name, e.last + 1), wa(nx.name, 3), wa(e.name, e.last + 2)])), chk: { t: "eralen", e: e.name, nx: true },
            why: `${e.name}${e.last}年（${nx.y0}年）の途中で${nx.name}に改元したので、${nx.y0}年は${nx.name}元年でもあります。次の${nx.y0 + 1}年は${a}です。`, src: nx.src };
        }
        const a = `${e.name}${e.last}年`;
        return { scene: `${nx.name}に変わる前の、${e.name}の最後の年。`, show: `${e.name}？年 → ${nx.name}元年`, ask: `${e.name}は何年まで？`, ans: a,
          opts: opts(R, a, shuffle(R, ERAS.filter((x) => x.last && x !== e).map((x) => `${e.name}${x.last}年`).concat([`${e.name}${e.last + 1}年`, `${e.name}${e.last - 1}年`]))), chk: { t: "eralen", e: e.name, nx: false },
          why: `${nx.name}元年の${nx.y0}年に改元したので、${e.name}は${e.last}年（${nx.y0}年）までです。`, src: nx.src };
      } },

    // ===== むずかしい =====
    { id: "edge", lv: 2, cat: "改元", name: "改元の前後", look: "改元の日から新しい元号。大正は7月30日、昭和は12月25日、平成は1月8日、令和は5月1日から。",
      note: "改元の日：大正 1912年7月30日、昭和 1926年12月25日、平成 1989年1月8日、令和 2019年5月1日。その前の日までは前の元号。",
      make(R) {
        const e = one(R, ERAS.filter((x) => x.start)), prev = ERAS[ERA[e.name].i - 1], after = one(R, [true, false]);
        const s = new Date(Date.UTC(e.y0, e.start[0] - 1, e.start[1])), t = new Date(s.getTime() + (after ? one(R, [0, 0, 1, 3]) : -one(R, [1, 1, 2, 5])) * 864e5);
        const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate(), [we, wn] = wareki(y, m, d), a = wa(we, wn);
        const ws = [wa(prev.name, prev.last), wa(e.name, 1), wa(prev.name, prev.last + 1), wa(e.name, 2), wa(prev.name, prev.last - 1)];
        return { scene: "古い書類の日付を和暦で書く。", show: `${y}年${m}月${d}日`, ask: "和暦では？", ans: a, opts: opts(R, a, shuffle(R, ws)), chk: { t: "edge", y, m, d },
          why: `${e.name}は${e.y0}年${e.start[0]}月${e.start[1]}日から。${m}月${d}日は${after ? `その日${t.getTime() === s.getTime() ? "" : "より後"}なので${e.name}元年` : `その前なので${prev.name}${prev.last}年`}です。`, src: e.src };
      } },
    { id: "age2", lv: 2, cat: "年齢", name: "誕生日と満年齢", look: "まず生まれ年を西暦に。今日の月日が誕生日より前なら1を引きます。",
      note: "満年齢は、生まれた年を西暦に直して今年から引き、今日がまだ誕生日の前なら1を引く。",
      make(R) {
        let e, n, bm, bd, y, m, d;
        do {
          e = one(R, ["昭和", "平成", "昭和"]); n = int(R, 2, lastOf(ERA[e]) - 1); bm = int(R, 1, 12); bd = int(R, 1, DIM[bm - 1]); y = int(R, 2025, 2030); m = int(R, 1, 12); d = int(R, 1, DIM[m - 1]);
        } while (Math.abs(dayOfYear(m, d) - dayOfYear(bm, bd)) < 2);
        const by = toY(e, n), a0 = age(by, bm, bd, y, m, d), a = `${a0}歳`;
        return { scene: `${wa(e, n)}${bm}月${bd}日生まれの人の年齢。`, show: `今日：${y}年${m}月${d}日`, ask: "満年齢は？", ans: a,
          opts: opts(R, a, shuffle(R, [a0 + 1, a0 - 1, a0 + 2, a0 - 2]).map((v) => `${v}歳`)), chk: { t: "age2", e, n, bm, bd, y, m, d },
          why: `${wa(e, n)}は${by}年。${y}−${by}＝${y - by}。${m}月${d}日は誕生日（${bm}月${bd}日）${a0 === y - by ? "を過ぎているので" : "の前なので1を引いて"}${a}です。`, src: "A" };
      } },
    { id: "kanshi", lv: 2, cat: "干支", name: "六十干支の次", look: "十干と十二支を1つずつ同時に進めます（甲子→乙丑→丙寅…）。60でひと回り。",
      note: "六十干支は、十干と十二支を1つずつ同時に進めた組み合わせ（甲子・乙丑・丙寅…）。癸亥の次は甲子にもどり、60でひと回り（還暦）。",
      make(R) {
        const i = int(R, 0, 59), j = (i + 2) % 60, a = `${KANSHI[j]}（${KANSHI_R[j]}）`;
        const mk = (k, s) => `${KAN[k % 10]}${SHI[s % 12]}（${KAN_R[k % 10]}${SHI_R[s % 12]}）`;
        return { scene: "暦の六十干支の並びを読む。", show: `${KANSHI[i]}・${KANSHI[(i + 1) % 60]}・？`, ask: "次は？", ans: a,
          opts: opts(R, a, shuffle(R, [mk(j, j + 1), mk(j + 1, j), mk(j, j + 11), mk(j + 9, j), mk(j + 1, j + 1)])), chk: { t: "kanshi", i },
          why: `十干は${KAN[(i + 1) % 10]}の次が${KAN[j % 10]}、十二支は${SHI[(i + 1) % 12]}の次が${SHI[j % 12]}。だから${a}です。`, src: "K" };
      } },
    { id: "cross", lv: 2, cat: "和暦", name: "元号をまたいで", look: "西暦に直して年数を足し、また和暦にもどします。",
      note: "元号をまたぐ計算は、いったん西暦に直す。昭和50年（1975）の30年後は2005年＝平成17年。",
      make(R) {
        let e, n, k, y, w;
        do { e = one(R, ["昭和", "平成"]); n = int(R, 1, lastOf(ERA[e])); k = one(R, [5, 10, 15, 20, 25, 30, 35, 40]); y = toY(e, n) + k; w = yearOnly(y); } while (!w || w[0] === e || y > 2030);
        const [we, wn] = w, a = wa(we, wn), ws = [wa(we, wn + 1), wa(we, wn - 1), wa(e, n + k), wn - 1 > 0 ? wa(we, wn - 1) : null, wa(we, wn + 2)];
        return { scene: `${wa(e, n)}の${k}年後の年。`, show: `${wa(e, n)} ＋ ${k}年`, ask: "和暦では？", ans: a, opts: opts(R, a, shuffle(R, ws)), chk: { t: "cross", e, n, k },
          why: `${wa(e, n)}は${toY(e, n)}年。${k}年後は${y}年で、${a}です（${we}元年＝${ERA[we].y0}年）。`, src: ERA[we].src };
      } },
  ];

  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)));
    return { tag, kind, lv: k.lv, cat: k.cat, name: k.name, look: k.look, note: k.note, ...p };
  }
  const keyOf = (P) => JSON.stringify([P.kind, P.scene, P.show || null, P.ask, P.ans]);

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  // 和暦帳の早見
  const TABLE = [
    ["元号", ERAS.map((e) => `${e.name}元年＝${e.y0}年${e.start ? `（${e.start[0]}月${e.start[1]}日から）` : ""}${e.last ? `・${e.name}${e.last}年まで` : ""}`)],
    ["早見", ["昭和＋1925＝西暦", "平成＋1988＝西暦", "令和＋2018＝西暦"]],
    ["十二支", SHI.map((s, i) => `${s}（${SHI_R[i]}）`)],
    ["十干", KAN.map((s, i) => `${s}（${KAN_R[i]}）`)],
    ["年齢", ["満年齢＝今年−生まれた年（誕生日の前なら−1）", "年齢は生まれた日から数える"]],
  ];

  const WAREKI = { KINDS, BY, LV, SRC, ERAS, ERA, KAN, KAN_R, SHI, SHI_R, KANSHI, KANSHI_R, TABLE, wareki, yearOnly, toY, age, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = WAREKI; else root.WAREKI = WAREKI;
})(typeof self !== "undefined" ? self : this);
