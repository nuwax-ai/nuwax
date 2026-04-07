const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/types/interfaces/i18n.ts',
  'src/constants/i18n.constants.ts',
  'src/locales/i18n/index.ts',
  'src/services/i18n.ts',
];

filesToUpdate.forEach((rel) => {
  const filePath = path.join(process.cwd(), rel);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace 'NuwaxPC' with 'PC' globally
  content = content.replace(/'NuwaxPC'/g, "'PC'");

  // Replace object definition in index.ts
  content = content.replace(/NuwaxPC:/g, 'PC:');

  if (rel === 'src/constants/i18n.constants.ts') {
    // Specifically fix the regex to match governance
    const oldRegex =
      /\/\^\(NuwaxPC\|NuwaxMobile\|NuwaClaw\)\\\.\(Pages\|Components\|Toast\|Modal\|Common\)\\\\.\[A-Z\]\[A-Za-z0-9\]\*\\\\\.\[a-z\]\[A-Za-z0-9\]\*\$\//g;
    const newRegex =
      '/^(PC|NuwaxMobile|NuwaClaw)\\.(Pages|Components|Toast|Modal|Common|Hooks|Layouts|Models)\\.([A-Za-z0-9]+\\.)+[a-z][A-Za-z0-9]*$/';
    content = content.replace(oldRegex, newRegex);
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('[replace-nuwaxpc] Done replacing globally.');
