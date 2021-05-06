const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');


const [execPath, binPath, ...arg] = process.argv;

function main() {
  const gitMdCheckStatus = execSync('git status --porcelain')
                    .toString()
                    .trim()
                    .split('\n')
                    .map(item => item.split(/\s+/).filter(str => str.replace(/\s+/))[1])
                    .map(item => path.join(__dirname, '../', item))
                    .filter(item => fs.statSync(item).isFile())
                    .filter(item => item.substr(item.lastIndexOf('.')) === '.md');
  // 读取文件内容
  gitMdCheckStatus.map(filePath => {
    const file = fs.readFileSync(filePath, 'utf8');
    const resultData = file.replace(/(?<=\!\[.*?\])\((?!http|https)(.*?)\)/g, '(https://raw.githubusercontent.com/shamerKill/shamerKill.github.io/master/$1)');
    fs.writeFileSync(filePath, resultData, 'utf8');
  })
  execSync(`git add ${gitMdCheckStatus.join(' ')}`);
}

try {
  main();
} catch (err) {
  console.log(err);
  exit(0);
}