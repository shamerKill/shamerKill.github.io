const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');


const [execPath, binPath, ...arg] = process.argv;

function main() {
  const gitFileStatus = execSync('git status --porcelain')
    .toString()
    .trim()
    .split('\n')
    .map(item => item.split(/\s+/))
    .filter(item => (item[0] !== '??' && item[0] !== 'D'))
    .map(item => {
      if (item[0] === 'R') return item[3];
      if (item[0] === 'A') return item[1];
      if (item[0] === 'M' || item[0] === 'MM') return item[1];
      console.log(item);
    })
    .map(item => path.join(__dirname, '../', item))
    .filter(item => fs.statSync(item).isFile());
  // 对图片进行压缩
  // const gitImgCheckStatus = gitFileStatus.filter(item => ['.jpg', '.jpeg', '.png'].includes(item.substr(item.lastIndexOf('.'))));
  // execSync(`git add ${gitImgCheckStatus.join(' ')}`);
  // 处理markdown图片引入
  const gitMdCheckStatus = gitFileStatus.filter(item => item.substr(item.lastIndexOf('.')) === '.md');
  gitMdCheckStatus.map(filePath => {
    const file = fs.readFileSync(filePath, 'utf8');
    const resultData = file.replace(/(?<=\!\[.*?\])\((?!http|https)(.*?)\)/g, '(https://raw.githubusercontent.com/shamerKill/shamerKill.github.io/master/$1)');
    fs.writeFileSync(filePath, resultData, 'utf8');
  })
  if (gitMdCheckStatus.length) execSync(`git add ${gitMdCheckStatus.join(' ')}`);
}

try {
  main();
} catch (err) {
  console.log(err);
  exit(0);
}