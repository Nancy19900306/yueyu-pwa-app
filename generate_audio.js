// generate_audio.js - 批量生成粤语音频
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 引入完整数据库
const CANTONESE_FULL_DB = require('./cantonese_full_db.js');

// 创建音频目录
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
  console.log('📁 创建 audio 目录');
}

// 生成单个音频
function generateAudio(text, filename, index, total) {
  return new Promise((resolve) => {
    // 显示进度
    process.stdout.write(`  [${index}/${total}] ${text}... `);
    
    const command = `edge-tts --text "${text}" --voice zh-HK-HiuMaanNeural --write-media "${filename}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ 失败');
        resolve(false);
      } else {
        console.log('✅ 成功');
        resolve(true);
      }
    });
  });
}

// 批量生成
async function generateAll() {
  console.log('\n🎤 开始生成粤语音频 (使用 edge-tts)');
  console.log('🗣️ 语音: zh-HK-HiuMaanNeural (粤语女声)\n');
  
  let total = 0;
  let success = 0;
  let fail = 0;
  
  // 统计总数
  for (let level = 1; level <= 10; level++) {
    total += CANTONESE_FULL_DB[level].length;
  }
  
  let current = 0;
  
  for (let level = 1; level <= 10; level++) {
    const sentences = CANTONESE_FULL_DB[level];
    console.log(`\n📚 第 ${level} 关 (${sentences.length}句)`);
    
    for (let i = 0; i < sentences.length; i++) {
      current++;
      const text = sentences[i].c;
      // 清理文件名中的特殊字符
      const safeName = text.replace(/[？?！!。，、；：""''《》【】（）/\\:*?"<>|]/g, '_');
      const filename = path.join(audioDir, `l${level}_${i+1}_${safeName}.mp3`);
      
      const ok = await generateAudio(text, filename, current, total);
      if (ok) {
        success++;
      } else {
        fail++;
      }
      
      // 避免请求过快，每5个休息一下
      if (current % 5 === 0) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 生成完成！`);
  console.log(`   ✅ 成功: ${success}`);
  console.log(`   ❌ 失败: ${fail}`);
  console.log(`   📁 保存位置: ${audioDir}`);
  console.log('='.repeat(50));
  
  // 生成索引文件，供前端使用
  generateIndexFile();
}

// 生成音频索引文件
function generateIndexFile() {
  const index = {
    generatedAt: new Date().toISOString(),
    voice: 'zh-HK-HiuMaanNeural',
    total: 0,
    levels: {}
  };
  
  for (let level = 1; level <= 10; level++) {
    const sentences = CANTONESE_FULL_DB[level];
    index.levels[level] = [];
    index.total += sentences.length;
    
    for (let i = 0; i < sentences.length; i++) {
      const text = sentences[i].c;
      const safeName = text.replace(/[？?！!。，、；：""''《》【】（）/\\:*?"<>|]/g, '_');
      index.levels[level].push({
        id: i + 1,
        text: text,
        filename: `l${level}_${i+1}_${safeName}.mp3`,
        jyutping: sentences[i].j,
        meaning: sentences[i].m
      });
    }
  }
  
  fs.writeFileSync(path.join(audioDir, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`📄 已生成索引文件: audio/index.json`);
}

// 检查 edge-tts 是否可用
function checkEdgeTts() {
  return new Promise((resolve) => {
    exec('edge-tts --version', (error) => {
      if (error) {
        console.error('\n❌ edge-tts 未安装！');
        console.log('\n请先安装: npm install -g edge-tts');
        console.log('或者: pip install edge-tts\n');
        resolve(false);
      } else {
        console.log('✅ edge-tts 已就绪');
        resolve(true);
      }
    });
  });
}

// 主函数
async function main() {
  console.log('\n🚀 粤语闯关王 - 音频生成工具\n');
  
  const hasEdgeTts = await checkEdgeTts();
  if (!hasEdgeTts) return;
  
  await generateAll();
}

main();