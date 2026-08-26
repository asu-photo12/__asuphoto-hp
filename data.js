/* ============================================================
   共有データモデル
   このサイトと管理サイトは window.storage の同じキー
   ("site-content", shared=true) を読み書きすることで同期します。
   ここにあるオブジェクトは「まだ一度も保存されていないときの初期値」です。
   ============================================================ */

var STORAGE_KEY = "site-content";

var DEFAULT_CONTENT = {
  brand: {
    nameEn: "Eri",
    nameJa: "えり",
    logoLabel: "Photographer"
  },
  hero: {
    photo: "https://picsum.photos/seed/eri-hero-warm/1800/1000",
    headline: "特別な日だけじゃない、\nいつもの幸せを。",
    sub: "何年経っても色褪せない思い出を形に。"
  },
  profile: {
    photo: "https://picsum.photos/seed/eri-profile-casual/700/860",
    nameEn: "Eri",
    role: "フォトグラファー　えり",
    body1: "埼玉県出身の出張撮影カメラマン。結婚式の前撮り、家族写真の撮影をメインに活動しています。休みの日はもっぱら喫茶店めぐり。",
    body2: "作られた表情よりも、生まれる表情を。緊張をほどく雑談から撮影は始まります。"
  },
  sections: {
    profile: { eyebrow: "PROFILE" },
    plans: {
      eyebrow: "PLAN / PRICE",
      title: "撮影プラン / 料金",
      lead: "ご用途に合わせてカテゴリー別にプランを\nご用意しています。気になるプランをクリックしてください。",
      ctaLabel: "プランについて相談する"
    },
    gallery: {
      eyebrow: "GALLERY",
      title: "ギャラリー",
      lead: "実際にご依頼いただいた撮影の一部です。"
    },
    voices: {
      eyebrow: "VOICE",
      title: "お客様の声"
    },
    faq: {
      eyebrow: "FAQ",
      title: "よくある質問"
    },
    terms: {
      eyebrow: "TERMS",
      title: "ご利用規約",
      lead: "ご予約前に、撮影に関するお願いごとや\nキャンセル料・交通費についてご確認ください。",
      linkLabel: "詳しくはこちらをご覧ください"
    }
  },
  gallery: [
    { cat: "location", catLabel: "ロケーションフォト", photo: "https://picsum.photos/seed/mv-loc1/600/750", caption: "草原の光の中で — 春" },
    { cat: "shichigosan", catLabel: "七五三", photo: "https://picsum.photos/seed/mv-753-1/600/750", caption: "晴れ着姿の記念撮影 — 秋" },
    { cat: "newborn", catLabel: "ナチュラルニューボーン", photo: "https://picsum.photos/seed/mv-nb1/600/750", caption: "小さな手のひら — 春" },
    { cat: "location", catLabel: "ロケーションフォト", photo: "https://picsum.photos/seed/mv-loc2/600/750", caption: "夕方の草原にて — 夏" },
    { cat: "newborn", catLabel: "ナチュラルニューボーン", photo: "https://picsum.photos/seed/mv-nb2/600/750", caption: "すやすや眠る赤ちゃん — 冬" },
    { cat: "uchiphoto", catLabel: "お家フォト", photo: "./images/ouchi-01.jpg", caption: "リビングでのひととき — 冬" },
    { cat: "uchiphoto", catLabel: "お家フォト", photo: "./images/ouchi-02.jpg", caption: "窓辺の家族団らん — 冬" },
    { cat: "uchiphoto", catLabel: "お家フォト", photo: "./images/ouchi-03.jpg", caption: "お兄ちゃんの抱っこデビュー — 冬" },
    { cat: "uchiphoto", catLabel: "お家フォト", photo: "./images/ouchi-04.jpg", caption: "うさぎさんとおひるね — 冬" },
    { cat: "uchiphoto", catLabel: "お家フォト", photo: "./images/ouchi-05.jpg", caption: "陽だまりの中で — 冬" },
    { cat: "uchiphoto", catLabel: "お家フォト", photo: "./images/ouchi-06.jpg", caption: "ごきげんな寝顔 — 冬" },
    { cat: "uchiphoto", catLabel: "お家フォト", photo: "./images/ouchi-07.jpg", caption: "わんこも一緒に家族写真 — 冬" }
  ],
  planCategories: [
    {
      key: "family",
      label: "家族写真",
      labelEn: "Family",
      photo: "https://picsum.photos/seed/plan-family-cover/700/500",
      intro: "ご家族の日常やイベントを、<b>自然な雰囲気のまま</b>残すプランです。",
      notes: ["撮影は屋外・自然光の入る場所が中心です", "ご兄弟の追加料金はなし", "未就学のお子様も歓迎です"],
      plans: [
        { name: "Mini Plan", popular: false, price: "¥18,000", desc: "撮影を試してみたい方や短時間で撮りたい方", duration: "撮影時間 40分前後", delivery: "データ納品 15cut" },
        { name: "Standard Plan", popular: true, price: "¥20,000", desc: "ご家族の大事なイベントや思い出をしっかり残したい方におすすめ", duration: "撮影時間 1時間前後", delivery: "データ納品 40cut" },
        { name: "Premium Plan", popular: false, price: "¥26,000", desc: "少しの表情の変化も全て残したい方向け。様々なシーンをたくさんお届けします", duration: "撮影時間 1時間半前後", delivery: "データ納品 80cut" }
      ]
    },
    {
      key: "shichigosan",
      label: "七五三",
      labelEn: "Shichigosan",
      photo: "https://picsum.photos/seed/plan-shichigosan-cover/700/500",
      intro: "一生に一度の<b>ハレの日</b>を、自然な表情のまま残します。",
      notes: ["着付け後のお時間に合わせて撮影します", "神社への同行も可能です", "ご兄弟姉妹の同時撮影も歓迎です"],
      plans: [
        { name: "Mini Plan", popular: false, price: "¥23,000", desc: "定番ショットのみを短時間で残したい方", duration: "撮影時間 40分前後", delivery: "データ納品 30cut" },
        { name: "Standard Plan", popular: true, price: "¥26,000", desc: "ハレの日の記録をしっかり残したい方", duration: "撮影時間 1時間前後", delivery: "データ納品 70cut" },
        { name: "Premium Plan", popular: false, price: "¥32,000", desc: "主役のお子様が複数いらっしゃる方、すべてのシーンを残したい方", duration: "撮影時間 1時間30分前後", delivery: "データ納品 100cut" }
      ]
    },
    {
      key: "omiyamairi",
      label: "お宮参り",
      labelEn: "Omiyamairi",
      photo: "https://picsum.photos/seed/plan-omiyamairi-cover/700/500",
      intro: "赤ちゃんとご家族にとって特別な一日を、<b>あたたかく</b>残します。",
      notes: ["祖父母様とのご参加も歓迎です", "授乳・お世話のお時間は気にせずお伝えください", "神社での撮影許可はご自身でご確認ください"],
      plans: [
        { name: "Mini Plan", popular: false, price: "¥20,000", desc: "定番ショットのみを短時間で残したい方", duration: "撮影時間 40分前後", delivery: "データ納品 30cut" },
        { name: "Standard Plan", popular: true, price: "¥22,000", desc: "ハレの日の記録をしっかり残したい方", duration: "撮影時間 1時間前後", delivery: "データ納品 50cut" },
        { name: "Premium Plan", popular: false, price: "¥30,000", desc: "主役のお子様が複数いらっしゃる方、すべてのシーンを残したい方", duration: "撮影時間 1時間30分前後", delivery: "データ納品 100cut" }
      ]
    },
    {
      key: "uchiphoto",
      label: "お家フォト",
      labelEn: "Ouchi Photo",
      photo: "./images/ouchi-01.jpg",
      intro: "<b>2歳まで</b>のお子様がいるご家庭で、お家で遊んだり、抱っこしたり、絵本を読んだり。そんな何気ない未来に残したい写真を撮るお手伝いをさせてください。",
      notes: ["撮影場所はお家のみ・お家周辺となります", "ご兄弟の追加料金はなし", "ナチュラルニューボーン、マタニティも含みます"],
      plans: [
        { name: "Standard Plan", popular: false, price: "¥18,000", desc: "遊び、抱っこなど今残したい瞬間をしっかり", duration: "撮影時間 1時間前後", delivery: "データ納品 40cut" },
        { name: "Premium Plan", popular: true, price: "¥23,000", desc: "たっぷり時間をかけてすべての瞬間を残したい方", duration: "撮影時間 1時間半前後", delivery: "データ納品 70cut" }
      ]
    }
  ],
  voices: [
    { text: "人見知りの息子がここまで自然に笑うとは思いませんでした。あの日の空気ごと残していただけた気がします。", who: "M様 ／ Family" },
    { text: "前撮りが苦手意識だったのですが、雑談しているうちに終わっていました。仕上がりも自然で大満足です。", who: "S・K様 ／ Wedding" },
    { text: "緊張していたのを覚えていてくださって、進行がとても優しかったです。写真も想像以上でした。", who: "T様 ／ Portrait" }
  ],
  faqCategories: [
    {
      key: "booking",
      title: "ご予約について",
      items: [
        { question: "撮影は屋外のみですか？", answer: "屋外での自然光撮影が中心ですが、お家フォトプランなど室内での撮影にも対応しています。" },
        { question: "天候が悪い場合はどうなりますか？", answer: "雨天の場合は日程の振替、または屋根のある場所への変更でご案内しています。" },
        { question: "キャンセルや日程変更はできますか？", answer: "撮影日の3日前までのご連絡で無料にて承ります。それ以降はキャンセル料が発生する場合がございます。" }
      ]
    },
    {
      key: "shooting",
      title: "撮影・お支払いについて",
      items: [
        { question: "兄弟姉妹がいる場合、追加料金はかかりますか？", answer: "ご兄弟・ご姉妹の追加料金はいただいておりません。人数に関わらず同一料金です。" },
        { question: "データはどのように納品されますか？", answer: "レタッチ後、オンライン上のギャラリーよりダウンロードいただく形でお届けします。" },
        { question: "支払い方法を教えてください", answer: "銀行振込、または当日現金にて承っております。詳しくはお問い合わせください。" }
      ]
    }
  ],
  termsSections: [
    {
      title: "お客様へのお願い",
      body: "神社や施設への撮影許可申請は、お客様ご自身でお願いしております（お早めにご確認ください）。\n\n入園料がかかる場所の場合は、カメラマンの分もご負担をお願いいたします。\n\nお客様の遅刻による撮影時間の延長や内容の保証は行っておりません。必ず時間に余裕をもってお越しください。",
      rows: []
    },
    {
      title: "お客様へのお願い２",
      body: "撮影中の怪我や事故等について、一切の責任を負いかねます。また貴重品のお預かりはいたしかねますので、お子様の安全管理と貴重品の管理をお願いいたします。\n\n「写真」という商品の特性上、撮影後の返金対応はできかねます。ご希望のショットなど細かいご要望は、事前のヒアリングでお伝えください。",
      rows: []
    },
    {
      title: "お支払い・キャンセル料について",
      body: "お支払いは当日現金、または事前振込にてお願いしております。\n\n撮影日程の延期・雨天中止の場合、キャンセル料はかかりません。無断キャンセルの場合は撮影金額の全額をいただく場合がございます。",
      rows: [
        { label: "4日前〜2日前", value: "¥2,000" },
        { label: "前日", value: "¥3,000" },
        { label: "当日", value: "¥5,000" }
      ]
    },
    {
      title: "撮影・データ納品について",
      body: "撮影時の小物の貸し出しは無料です。特別な衣装や装飾に関しては、別途有料オプションとなりますのでご希望の方は事前にご連絡ください。\n\nデータはオンラインアルバムにてお渡しします。納期は2週間〜1ヶ月前後をいただいております。\n\nオンラインアルバムでの閲覧期間は2ヶ月程度、元データの保管期間は6ヶ月とさせていただきます。納品後はご自身での保存・管理をお願いします。",
      rows: []
    },
    {
      title: "交通費・出張費について",
      body: "自宅より片道40分以上の撮影場所は、交通費に加えて出張費をいただいております。1時間以上かかる場合は、事前にご相談ください。",
      rows: [
        { label: "片道40分", value: "+¥1,000" },
        { label: "片道50分", value: "+¥1,500" },
        { label: "片道60分", value: "+¥2,000" }
      ]
    }
  ],
  contact: {
    heading: "まずは、お気軽にご相談ください",
    body: "撮影のイメージが固まっていなくても大丈夫です。日程やご予算など、なんでもお聞かせください。",
    email: "hello@eri-photo.example.jp",
    instagram: "@eri.photo",
    tel: "090-0000-0000"
  },
  footer: {
    copyright: "© 2026 Eri Photography"
  }
};

/* 保存されている内容を取得。無ければデフォルトを返す */
async function loadContent() {
  try {
    if (!window.storage) throw new Error("storage unavailable");
    const result = await window.storage.get(STORAGE_KEY, true);
    if (result && result.value) {
      const saved = JSON.parse(result.value);
      // デフォルトとマージして、新しく追加された項目が欠けないようにする
      return deepMerge(structuredClone(DEFAULT_CONTENT), saved);
    }
  } catch (e) {
    console.log("保存データが見つからないため初期値を使用します", e);
  }
  return structuredClone(DEFAULT_CONTENT);
}

async function saveContent(content) {
  if (!window.storage) {
    throw new Error("この画面ではデータの保存機能が使えません（Claudeのアーティファクトとして開いた場合にのみ保存できます）");
  }
  return await window.storage.set(STORAGE_KEY, JSON.stringify(content), true);
}

function deepMerge(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (typeof base === "object" && base !== null) {
    const out = { ...base };
    for (const k in override || {}) {
      out[k] = deepMerge(base[k], override[k]);
    }
    return out;
  }
  return override !== undefined ? override : base;
}
