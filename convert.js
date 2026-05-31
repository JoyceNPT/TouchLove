const fs = require('fs');
const TurndownService = require('turndown');
const turndownService = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });

['priv_en', 'terms_en'].forEach(name => {
  let html = fs.readFileSync(name + '.html', 'utf8');
  // Strip <strong> from headers
  html = html.replace(/<h([1-6])><strong>(.*?)<\/strong><\/h\1>/g, '<h$1>$2</h$1>');
  const md = turndownService.turndown(html);
  
  let finalMd = md.replace(/^# (\d+\\?\..*)$/gm, '## $1');
  finalMd = finalMd.replace(/^## (\d+\.\d+\s+.*)$/gm, '### $1');
  
  // also unescape \. in headings if turndown escaped it
  finalMd = finalMd.replace(/(\d+)\\\./g, '$1.');
  
  fs.writeFileSync(name + '.md', finalMd);
});
