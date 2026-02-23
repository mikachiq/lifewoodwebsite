const fs = require("fs");

const path = "constants.ts";
let src = fs.readFileSync(path, "utf8");

const order = [
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

const additions = {
  zhBase: {
    contactLandingSub: "欢迎联系我们。我们的团队通常会在 24 小时内回复。",
    contactSubjectLabel: "咨询类型",
    contactMessagePlaceholder: "我们可以如何帮助您？",
    careerHiringStep1Desc: "您的申请将由我们的人力资源团队进行审核。",
    careerHiringStep2Desc: "我们将根据岗位要求评估您的简历。",
    careerHiringStep3Desc: "您将收到包含申请详情的确认邮件。",
    careerHiringStep4Desc: "如果您的背景匹配岗位需求，我们的团队将与您联系。",
  },
  msBase: {
    contactLandingSub: "Kami ingin mendengar daripada anda. Pasukan kami biasanya membalas dalam masa 24 jam.",
    contactSubjectLabel: "Jenis Pertanyaan",
    contactMessagePlaceholder: "Bagaimana kami boleh membantu?",
    careerHiringStep1Desc: "Permohonan anda akan disemak oleh pasukan HR kami.",
    careerHiringStep2Desc: "CV anda akan dinilai berdasarkan keperluan kami.",
    careerHiringStep3Desc: "Anda akan menerima e-mel pengesahan dengan butiran permohonan anda.",
    careerHiringStep4Desc: "Pasukan kami akan menghubungi anda jika profil anda sepadan dengan keperluan kami.",
  },
  tlBase: {
    contactLandingSub: "Gusto naming marinig mula sa iyo. Karaniwan kaming tumutugon sa loob ng 24 oras.",
    contactSubjectLabel: "Uri ng Inquiry",
    contactMessagePlaceholder: "Paano kami makakatulong?",
    careerHiringStep1Desc: "Susuriin ng aming HR team ang iyong aplikasyon.",
    careerHiringStep2Desc: "Susuriin ang iyong CV batay sa aming mga kinakailangan.",
    careerHiringStep3Desc: "Makakatanggap ka ng confirmation email kasama ang detalye ng iyong aplikasyon.",
    careerHiringStep4Desc: "Makikipag-ugnayan ang aming team kung tugma ang iyong profile sa aming pangangailangan.",
  },
  bnBase: {
    contactLandingSub: "আমরা আপনার কথা শুনতে আগ্রহী। আমাদের টিম সাধারণত ২৪ ঘণ্টার মধ্যে সাড়া দেয়।",
    contactSubjectLabel: "অনুসন্ধানের ধরন",
    contactMessagePlaceholder: "আমরা কীভাবে সাহায্য করতে পারি?",
    careerHiringStep1Desc: "আপনার আবেদন আমাদের HR টিম পর্যালোচনা করবে।",
    careerHiringStep2Desc: "আমাদের চাহিদার ভিত্তিতে আপনার CV মূল্যায়ন করা হবে।",
    careerHiringStep3Desc: "আপনার আবেদনের বিস্তারিতসহ একটি নিশ্চিতকরণ ইমেইল পাবেন।",
    careerHiringStep4Desc: "আপনার প্রোফাইল আমাদের প্রয়োজনের সাথে মিললে আমাদের টিম আপনার সাথে যোগাযোগ করবে।",
  },
  hiBase: {
    contactLandingSub: "हम आपसे सुनना चाहते हैं। हमारी टीम आमतौर पर 24 घंटे के भीतर जवाब देती है।",
    contactSubjectLabel: "पूछताछ का प्रकार",
    contactMessagePlaceholder: "हम कैसे मदद कर सकते हैं?",
    careerHiringStep1Desc: "आपके आवेदन की समीक्षा हमारी HR टीम करेगी।",
    careerHiringStep2Desc: "आपके CV का मूल्यांकन हमारी आवश्यकताओं के आधार पर किया जाएगा।",
    careerHiringStep3Desc: "आपको आपके आवेदन विवरण के साथ एक पुष्टि ईमेल प्राप्त होगा।",
    careerHiringStep4Desc: "यदि आपकी प्रोफ़ाइल हमारी ज़रूरतों से मेल खाती है तो हमारी टीम आपसे संपर्क करेगी।",
  },
  esBase: {
    contactLandingSub: "Nos encantaría saber de ti. Nuestro equipo suele responder dentro de 24 horas.",
    contactSubjectLabel: "Tipo de Consulta",
    contactMessagePlaceholder: "¿Cómo podemos ayudarte?",
    careerHiringStep1Desc: "Tu solicitud será revisada por nuestro equipo de RR. HH.",
    careerHiringStep2Desc: "Tu CV será evaluado según nuestros requisitos.",
    careerHiringStep3Desc: "Recibirás un correo de confirmación con los detalles de tu solicitud.",
    careerHiringStep4Desc: "Nuestro equipo te contactará si tu perfil coincide con nuestras necesidades.",
  },
  koBase: {
    contactLandingSub: "문의해 주시면 감사하겠습니다. 저희 팀은 보통 24시간 이내에 답변드립니다.",
    contactSubjectLabel: "문의 유형",
    contactMessagePlaceholder: "어떻게 도와드릴까요?",
    careerHiringStep1Desc: "귀하의 지원서는 인사팀에서 검토합니다.",
    careerHiringStep2Desc: "귀하의 CV는 채용 요건에 따라 평가됩니다.",
    careerHiringStep3Desc: "지원 상세 정보와 함께 확인 이메일을 받게 됩니다.",
    careerHiringStep4Desc: "프로필이 요건에 부합하면 저희 팀이 연락드립니다.",
  },
};

function blockRange(name) {
  const start = src.indexOf(`const ${name}: TranslationSet = {`);
  const idx = order.indexOf(name);
  const next = order[idx + 1];
  const end = next
    ? src.indexOf(`const ${next}: TranslationSet = {`, start)
    : src.indexOf("export const TRANSLATIONS", start);
  return { start, end };
}

for (const [base, kv] of Object.entries(additions)) {
  const { start, end } = blockRange(base);
  let block = src.slice(start, end);
  for (const [key, value] of Object.entries(kv)) {
    const line = `  ${key}: ${JSON.stringify(value)},`;
    const rx = new RegExp(`^\\s{2}${key}:\\s*".*",?\\s*$`, "m");
    if (rx.test(block)) {
      block = block.replace(rx, line);
    } else {
      block = block.replace(/([^,\s])\n};\s*$/, "$1,\n};");
      block = block.replace(/\n};\s*$/, `\n${line}\n};`);
    }
  }
  src = src.slice(0, start) + block + src.slice(end);
}

fs.writeFileSync(path, src, "utf8");
console.log("Added missing contact/hiring description translations.");
