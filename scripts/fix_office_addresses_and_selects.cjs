const fs = require("fs");

const path = "constants.ts";
let src = fs.readFileSync(path, "utf8");

const bases = [
  "zhBase",
  "msBase",
  "tlBase",
  "bnBase",
  "hiBase",
  "esBase",
  "jaBase",
  "koBase",
];

const addr = {
  zhBase: {
    officeAddressPetalingJaya:
      "马来西亚雪兰莪州八打灵再也 47820，B-13-01，Menara Bata，PJ Trade Centre，No 8，Jalan PJU 8/8A，Bandar Damansara Perdana",
    officeAddressManila:
      "菲律宾大马尼拉大区塔吉格市，Bonifacio Global City，26th Street",
    officeAddressDavao: "菲律宾达沃市 Bajada，Pryce Tower",
    officeAddressCebu: "菲律宾宿务市 Lahug，Cebu IT Park",
    officeAddressShenzhen: "中国深圳市南山区，南山科技园",
    officeAddressTokyo: "日本东京千代田区丸之内",
    officeAddressLondon: "英国伦敦金丝雀码头",
    officeAddressNewYork: "美国纽约州纽约市，曼哈顿商务区",
    officeAddressTaipei: "中国台湾台北市信义区",
  },
  msBase: {
    officeAddressPetalingJaya:
      "B-13-01, Menara Bata, PJ Trade Centre, No 8, Jalan PJU 8/8A, Bandar Damansara Perdana, 47820 Petaling Jaya, Selangor",
    officeAddressManila:
      "Jalan ke-26, Bonifacio Global City, Taguig, Metro Manila",
    officeAddressDavao: "Pryce Tower, Bajada, Bandar Davao",
    officeAddressCebu: "Cebu IT Park, Lahug, Bandar Cebu",
    officeAddressShenzhen:
      "Taman Sains dan Teknologi Nanshan, Daerah Nanshan",
    officeAddressTokyo: "Marunouchi, Bandar Chiyoda, Tokyo",
    officeAddressLondon: "Canary Wharf, London",
    officeAddressNewYork:
      "Daerah Perniagaan Manhattan, New York, NY",
    officeAddressTaipei: "Daerah Xinyi, Bandar Taipei",
  },
  tlBase: {
    officeAddressPetalingJaya:
      "B-13-01, Menara Bata, PJ Trade Centre, No 8, Jalan PJU 8/8A, Bandar Damansara Perdana, 47820 Petaling Jaya, Selangor",
    officeAddressManila:
      "26th Street, Bonifacio Global City, Taguig, Metro Manila",
    officeAddressDavao: "Pryce Tower, Bajada, Lungsod ng Davao",
    officeAddressCebu: "Cebu IT Park, Lahug, Lungsod ng Cebu",
    officeAddressShenzhen:
      "Nanshan Science and Technology Park, Distrito ng Nanshan",
    officeAddressTokyo: "Marunouchi, Chiyoda City, Tokyo",
    officeAddressLondon: "Canary Wharf, London",
    officeAddressNewYork:
      "Manhattan Business District, New York, NY",
    officeAddressTaipei: "Distrito ng Xinyi, Lungsod ng Taipei",
  },
  bnBase: {
    officeAddressPetalingJaya:
      "বি-১৩-০১, Menara Bata, PJ Trade Centre, নং ৮, Jalan PJU 8/8A, Bandar Damansara Perdana, ৪৭৮২০ পেতালিং জায়া, সেলাঙ্গর",
    officeAddressManila:
      "২৬তম স্ট্রিট, Bonifacio Global City, Taguig, মেট্রো ম্যানিলা",
    officeAddressDavao: "Pryce Tower, Bajada, দাভাও সিটি",
    officeAddressCebu: "Cebu IT Park, Lahug, সেবু সিটি",
    officeAddressShenzhen:
      "Nanshan Science and Technology Park, নানশান জেলা",
    officeAddressTokyo: "Marunouchi, Chiyoda City, টোকিও",
    officeAddressLondon: "Canary Wharf, লন্ডন",
    officeAddressNewYork:
      "Manhattan Business District, নিউ ইয়র্ক, NY",
    officeAddressTaipei: "Xinyi District, তাইপেই সিটি",
  },
  hiBase: {
    officeAddressPetalingJaya:
      "B-13-01, Menara Bata, PJ Trade Centre, No 8, Jalan PJU 8/8A, Bandar Damansara Perdana, 47820 पेतालिंग जाया, सेलांगोर",
    officeAddressManila:
      "26th Street, Bonifacio Global City, Taguig, मेट्रो मनीला",
    officeAddressDavao: "Pryce Tower, Bajada, दावाओ सिटी",
    officeAddressCebu: "Cebu IT Park, Lahug, सेबू सिटी",
    officeAddressShenzhen:
      "Nanshan Science and Technology Park, नानशान जिला",
    officeAddressTokyo: "Marunouchi, Chiyoda City, टोक्यो",
    officeAddressLondon: "Canary Wharf, लंदन",
    officeAddressNewYork:
      "Manhattan Business District, न्यूयॉर्क, NY",
    officeAddressTaipei: "Xinyi District, ताइपेई सिटी",
  },
  esBase: {
    officeAddressPetalingJaya:
      "B-13-01, Menara Bata, PJ Trade Centre, N.º 8, Jalan PJU 8/8A, Bandar Damansara Perdana, 47820 Petaling Jaya, Selangor",
    officeAddressManila:
      "Calle 26, Bonifacio Global City, Taguig, Metro Manila",
    officeAddressDavao: "Pryce Tower, Bajada, Dávao",
    officeAddressCebu: "Cebu IT Park, Lahug, Cebú",
    officeAddressShenzhen:
      "Nanshan Science and Technology Park, Distrito de Nanshan",
    officeAddressTokyo: "Marunouchi, Chiyoda, Tokio",
    officeAddressLondon: "Canary Wharf, Londres",
    officeAddressNewYork:
      "Distrito Empresarial de Manhattan, Nueva York, NY",
    officeAddressTaipei: "Distrito de Xinyi, Taipéi",
  },
  jaBase: {
    officeAddressPetalingJaya:
      "B-13-01、Menara Bata、PJ Trade Centre、No 8, Jalan PJU 8/8A、Bandar Damansara Perdana、47820 ペタリンジャヤ（セランゴール）",
    officeAddressManila:
      "26番通り、Bonifacio Global City、Taguig、メトロマニラ",
    officeAddressDavao: "Pryce Tower、Bajada、ダバオ市",
    officeAddressCebu: "Cebu IT Park、Lahug、セブ市",
    officeAddressShenzhen:
      "南山サイエンス＆テクノロジーパーク、南山区",
    officeAddressTokyo: "東京都千代田区丸の内",
    officeAddressLondon: "ロンドン、カナリー・ワーフ",
    officeAddressNewYork:
      "米国ニューヨーク州ニューヨーク市マンハッタン・ビジネス地区",
    officeAddressTaipei: "台北市信義区",
  },
  koBase: {
    officeAddressPetalingJaya:
      "B-13-01, Menara Bata, PJ Trade Centre, No 8, Jalan PJU 8/8A, Bandar Damansara Perdana, 47820 페탈링자야, 셀랑고르",
    officeAddressManila:
      "26번가, Bonifacio Global City, Taguig, 메트로 마닐라",
    officeAddressDavao: "Pryce Tower, Bajada, 다바오시",
    officeAddressCebu: "Cebu IT Park, Lahug, 세부시",
    officeAddressShenzhen:
      "Nanshan Science and Technology Park, 난산구",
    officeAddressTokyo: "도쿄도 지요다구 마루노우치",
    officeAddressLondon: "Canary Wharf, 런던",
    officeAddressNewYork:
      "Manhattan Business District, 뉴욕, NY",
    officeAddressTaipei: "Xinyi District, 타이베이시",
  },
};

function blockRange(name) {
  const start = src.indexOf(`const ${name}: TranslationSet = {`);
  if (start < 0) throw new Error(`Missing ${name}`);
  const idx = bases.indexOf(name);
  const next = bases[idx + 1];
  const all = [
    "enBase",
    "zhBase",
    "msBase",
    "tlBase",
    "bnBase",
    "hiBase",
    "esBase",
    "jaBase",
    "koBase",
  ];
  const end = next
    ? src.indexOf(`const ${next}: TranslationSet = {`, start)
    : src.indexOf("export const TRANSLATIONS", start);
  return { start, end };
}

for (const base of bases) {
  const { start, end } = blockRange(base);
  let block = src.slice(start, end);
  for (const [k, v] of Object.entries(addr[base])) {
    const rx = new RegExp(`^\\s{2}${k}:\\s*".*",?\\s*$`, "m");
    const line = `  ${k}: ${JSON.stringify(v)},`;
    if (rx.test(block)) block = block.replace(rx, line);
  }
  src = src.slice(0, start) + block + src.slice(end);
}

fs.writeFileSync(path, src, "utf8");
console.log("Updated localized office addresses.");
