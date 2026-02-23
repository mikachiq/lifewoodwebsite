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

const patch = {
  msBase: {
    careerJob1Loc: "Jarak Jauh / Global",
    careerJob2Loc: "Kuala Lumpur, Malaysia",
    careerJob4Loc: "Manila, Filipina",
  },
  tlBase: {
    careerTestimonial1Meta: "Lifewood Cebu Intern, Batch 8, 2026",
    careerCompensation: "Mapagkumpitensya at Batay sa Merito",
    careerJob1Dept: "Inhinyeriya",
    careerJob1Loc: "Remote / Pandaigdigan",
    careerJob2Dept: "Agham ng Datos",
    careerJob2Loc: "Kuala Lumpur, Malaysia",
    careerJob3Dept: "Agham ng Datos",
    careerJob3Loc: "Pandaigdigan / Hybrid",
    careerJob4Dept: "Operasyon",
    careerJob4Loc: "Maynila, Pilipinas",
    careerJob5Dept: "Quality Assurance",
    careerJob5Loc: "Hybrid / Pandaigdigan",
  },
  hiBase: {
    careerCompensation: "प्रतिस्पर्धी और मेरिट-आधारित",
  },
  esBase: {
    careerJob2Loc: "Kuala Lumpur, Malasia",
    careerJob4Loc: "Manila, Filipinas",
  },
};

function range(name) {
  const start = src.indexOf(`const ${name}: TranslationSet = {`);
  const i = order.indexOf(name);
  const next = order[i + 1];
  const end = next
    ? src.indexOf(`const ${next}: TranslationSet = {`, start)
    : src.indexOf("export const TRANSLATIONS", start);
  return { start, end };
}

for (const [base, pairs] of Object.entries(patch)) {
  const { start, end } = range(base);
  let block = src.slice(start, end);
  for (const [k, v] of Object.entries(pairs)) {
    const rx = new RegExp(`^\\s{2}${k}:\\s*".*",?\\s*$`, "m");
    const line = `  ${k}: ${JSON.stringify(v)},`;
    if (rx.test(block)) block = block.replace(rx, line);
    else block = block.replace(/\n};\s*$/, `\n${line}\n};`);
  }
  src = src.slice(0, start) + block + src.slice(end);
}

fs.writeFileSync(path, src, "utf8");
console.log("Final fallback replacements applied.");
