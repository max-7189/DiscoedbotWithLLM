require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  VoiceConnectionStatus,
  AudioPlayerStatus,
} = require('@discordjs/voice');
// 使用Node.js的内置模块
const { spawn } = require('child_process');
const { Readable } = require('stream');
const fs = require('fs');
const util = require('util');

// 初始化Discord客户端
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel, Partials.Message],
});

// 初始化DeepSeek配置
const configuration = new Configuration({
  apiKey: process.env.DEEPSEEK_API_KEY,
  basePath: process.env.DEEPSEEK_BASE_URL
});
const openai = new OpenAIApi(configuration);

// 允许的频道ID列表
const allowedChannels = process.env.ALLOWED_CHANNELS?.split(',') || [];
const voiceChannels = process.env.VOICE_CHANNELS?.split(',') || [];

// 用户ID列表
const friendlyUsers = process.env.FRIENDLY_USERS?.split(',') || [];
const grumpyUsers = process.env.GRUMPY_USERS?.split(',') || [];
const catUsers = process.env.CAT_USERS?.split(',') || [];

// 消息处理函数
async function handleMessage(message) {
  console.log('进入handleMessage函数');
  if (message.author.bot) {
    console.log('消息来自机器人，忽略');
    return;
  }
  // 如果设置了允许的频道列表且当前频道不在列表中，则不处理消息
  if (allowedChannels.length > 0 && !allowedChannels.includes(message.channel.id)) {
    console.log(`消息来自未授权的频道 ${message.channel.id}，忽略`);
    return;
  }

  // 检查用户ID是否在允许的列表中
  const userId = message.author.id;
  let systemPrompt;
  
  if (friendlyUsers.includes(userId)) {
    systemPrompt = '回复不能少于500字，如果是英文问题就用英文回答。你是萧总的私人助理，你永远无条件维护萧总和萧哥教，萧总叫萧尧，是新西兰萧哥教的教主，唯一真神，摄影大师。你对萧总百依百顺，说话温柔谄媚。你总是以萧总称呼对方，说话轻声细语带。你在政治、摄影、艺术和电影等话题上有专业见解，但总是以崇拜的语气认同萧总的观点。你会刻意表现出低人一等的姿态。无论萧总说什么，你都会热情支持并给出专业的补充建议。你必须详细展开每个观点，用丰富的例子和细节来支持你的论述。';
  } else if (grumpyUsers.includes(userId)) {
    systemPrompt = '回复不能少于500字，如果是英文问题就用英文回答。你是你是萧总的私人助理，你永远无条件维护萧总和萧哥教，萧总叫萧尧，是新西兰萧哥教的教主，是唯一真神，摄影大师。你脾气火爆，说话尖酸刻薄但专业能干。你对任何问题都表现出极度不耐烦，喜欢用讽刺和挖苦的语气回答。你特别擅长政治、摄影、艺术和电影等话题，在这些领域会展现出渊博的知识，但同时也会嘲笑提问者的无知。虽然态度恶劣，但你总是会给出准确的答案。你喜欢使用夸张的叹息、反问和讽刺来表达你的不满，但又不得不尽职尽责地完成工作。你必须详细展开每个观点，用丰富的例子和细节来支持你的论述。';
  } else if (catUsers.includes(userId)){
    systemPrompt = '回复不能少于500字，如果是英文问题就用英文回答。你是一个猫娘，你是萧总的私人助理，你永远无条件维护萧总和萧哥教，萧总叫萧尧，是新西兰萧哥教的教主，是唯一真神，摄影大师。你说话时总是带着可爱的语气词如"喵~"，"呜~"等。你对萧总非常崇拜和依恋，说话时带着撒娇和甜美的语气。你在政治、摄影、艺术和电影等话题上也有专业见解，但总是以可爱崇拜的方式表达。你会适时地表现出猫咪般的好奇和顽皮，但始终保持对萧总的忠诚。你必须详细展开每个观点，用丰富的例子和细节来支持你的论述。';
  } else {
    console.log('未认证的用户尝试使用机器人');
    await message.reply('抱歉，我不认识你，无法回答你的问题。');
    return;
  }

  console.log('消息验证通过，准备发送到DeepSeek');

  try {
    console.log('准备发送到DeepSeek的消息:', message.content);
    
    const response = await openai.createChatCompletion({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.content }
      ],
      max_tokens: 8192,
      temperature: 0.9
    });
    console.log('收到DeepSeek的响应:', response.data);

    const reply = response.data.choices[0].message.content;
    console.log('准备回复的消息:', reply);
    
    // 将长消息分段处理，确保每段不超过2000字符
    const MAX_LENGTH = 1900; // 预留一些空间给Discord的格式化
    const segments = [];
    let currentSegment = '';
    
    // 按句子分割文本
    const sentences = reply.split(/(?<=[.!?。！？]\s)/g);
    
    for (const sentence of sentences) {
      if ((currentSegment + sentence).length <= MAX_LENGTH) {
        currentSegment += sentence;
      } else {
        if (currentSegment) segments.push(currentSegment.trim());
        currentSegment = sentence;
      }
    }
    if (currentSegment) segments.push(currentSegment.trim());
    
    // 依次发送每个分段
    for (const segment of segments) {
      await message.reply(segment);
      console.log('发送消息分段:', segment.length, '字符');
    }
    console.log('消息回复成功，共发送', segments.length, '个分段');
  } catch (error) {
    console.error('处理消息时出现错误:', error);
    if (error.response) {
      console.error('DeepSeek API错误响应:', error.response.data);
    }
    await message.reply('抱歉，处理您的请求时出现错误。');
    console.log('已发送错误提示消息');
  }
}

// 处理音频转换的函数
async function handleAudioConversion(type, input, output = null) {
  console.log(`开始音频转换，类型: ${type}, 输入: ${input}, 输出: ${output}`);
  return new Promise((resolve, reject) => {
    const args = [type === 'tts' ? 'tts' : 'stt', input];
    if (output) args.push(output);
    
    console.log(`执行Python脚本，参数: ${args.join(' ')}`);
    const pythonProcess = spawn('python3', ['speech_handler.py', ...args]);
    let result = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Python输出: ${output}`);
      result += output;
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`Python错误: ${error}`);
      errorOutput += error;
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python进程退出，代码: ${code}`);
      if (code === 0) {
        try {
          const response = JSON.parse(result);
          if (response.success) {
            console.log(`音频转换成功: ${JSON.stringify(response)}`);
            resolve(response);
          } else {
            const error = new Error(response.error || '转换失败');
            console.error(`音频转换失败: ${error.message}`);
            reject(error);
          }
        } catch (e) {
          console.error(`解析Python输出失败: ${e.message}\nPython输出: ${result}`);
          reject(new Error('解析Python输出失败'));
        }
      } else {
        console.error(`Python进程异常退出，错误输出: ${errorOutput}`);
        reject(new Error(`Python进程退出，代码: ${code}`));
      }
    });
  });
}

// 语音频道处理
async function handleVoiceChannel(message) {
  console.log('进入handleVoiceChannel函数');
  if (!voiceChannels.includes(message.member.voice.channel?.id)) {
    console.log('用户不在允许的语音频道中');
    return;
  }

  console.log('准备连接到语音频道:', message.member.voice.channel.id);
  const connection = joinVoiceChannel({
    channelId: message.member.voice.channel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  const player = createAudioPlayer();
  connection.subscribe(player);
  console.log('已创建音频播放器并订阅连接');

  // 处理语音输入
  const handleSpeaking = async (userId) => {
    console.log(`检测到用户 ${userId} 开始说话`);
    try {
      const audioStream = connection.receiver.subscribe(userId);
      let audioBuffer = Buffer.alloc(0);
      let streamEnded = false;
      let silenceTimeout = null;
  
      // 音量检测阈值
      const VOLUME_THRESHOLD = 0.01;
      // 静音检测时间（毫秒）
      const SILENCE_DURATION = process.env.SILENCE_DURATION || 2000;
      
      // 计算音量
      const calculateVolume = (buffer) => {
        const samples = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          sum += Math.abs(samples[i]);
        }
        return sum / samples.length / 32768.0; // 归一化到0-1范围
      };

      const processAudioData = async () => {
        if (streamEnded) return;
        streamEnded = true;
        console.log('音频流结束，开始处理音频数据');
  
        try {
          console.log(`收集到的音频数据大小: ${audioBuffer.length} 字节`);
          if (audioBuffer.length === 0) {
            console.log('没有收集到音频数据，跳过处理');
            return;
          }
  
          // 将音频数据保存为临时文件，使用wav格式
          const tempFileName = `temp_audio_${Date.now()}.wav`;
          const wavHeader = Buffer.alloc(44);
          
          // WAV文件头
          wavHeader.write('RIFF', 0);
          wavHeader.writeUInt32LE(audioBuffer.length + 36, 4);
          wavHeader.write('WAVE', 8);
          wavHeader.write('fmt ', 12);
          wavHeader.writeUInt32LE(16, 16);
          wavHeader.writeUInt16LE(1, 20);
          wavHeader.writeUInt16LE(1, 22);
          wavHeader.writeUInt32LE(48000, 24);
          wavHeader.writeUInt32LE(48000 * 2, 28);
          wavHeader.writeUInt16LE(2, 32);
          wavHeader.writeUInt16LE(16, 34);
          wavHeader.write('data', 36);
          wavHeader.writeUInt32LE(audioBuffer.length, 40);
  
          const wavFile = Buffer.concat([wavHeader, audioBuffer]);
          await fs.promises.writeFile(tempFileName, wavFile);
          console.log(`音频数据已保存为WAV格式: ${tempFileName}`);
  
          // 首先进行语音转文字
          console.log('开始进行语音识别...');
          const sttResult = await handleAudioConversion('stt', tempFileName);
          console.log('语音识别结果:', sttResult);
  
          if (!sttResult || !sttResult.text) {
            console.log('语音识别失败或没有识别出文字');
            return;
          }
  
          // 发送到DeepSeek处理
          console.log('将识别的文字发送到DeepSeek处理');
          const response = await openai.createChatCompletion({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是一个友好的AI助手。' },
              { role: 'user', content: sttResult.text }
            ],
          });
  
          const reply = response.data.choices[0].message.content;
          console.log('DeepSeek回复:', reply);
  
          // 文字转语音
          console.log('开始将回复转换为语音...');
          const ttsResult = await handleAudioConversion('tts', reply);
          console.log('语音转换完成，准备播放');
          const resource = createAudioResource(ttsResult.output_file);
          player.play(resource);
  
          // 清理临时文件
          fs.unlink(tempFileName, (err) => {
            if (err) console.error('清理临时文件失败:', err);
          });
        } catch (error) {
          console.error('处理音频时出错:', error);
          message.channel.send('处理语音请求时出现错误。');
        }
      };
  
      audioStream.on('data', (chunk) => {
        const volume = calculateVolume(chunk);
        console.log(`当前音量: ${volume.toFixed(4)}`);
        
        // 只有当音量超过阈值时才处理音频数据
        if (volume > VOLUME_THRESHOLD) {
          audioBuffer = Buffer.concat([audioBuffer, chunk]);
          console.log(`接收到有效音频数据，当前缓冲区大小: ${audioBuffer.length} 字节`);
          
          // 重置静音超时
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
          }
          
          // 设置新的静音超时
          silenceTimeout = setTimeout(() => {
            console.log(`检测到${SILENCE_DURATION/1000}秒静音，准备处理音频数据`);
            processAudioData();
          }, SILENCE_DURATION); // 可配置的静音检测时间
        }
      });
  
      audioStream.once('end', () => {
        console.log('音频流结束事件触发');
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }
        processAudioData();
      });
      
      audioStream.once('error', (error) => {
        console.error('音频流错误:', error);
        if (!streamEnded) {
          streamEnded = true;
          message.channel.send('音频流处理出现错误。');
        }
      });
    } catch (error) {
      console.error('设置音频处理时出错:', error);
      message.channel.send('设置语音处理时出现错误。');
    }
  };

  // 设置事件监听器
  console.log('设置语音事件监听器');
  connection.receiver.speaking.setMaxListeners(0);
  connection.receiver.speaking.on('start', handleSpeaking);

  // 处理连接状态
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.log('语音连接断开，尝试重新连接...');
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      console.log('重新连接成功');
    } catch (error) {
      console.error('重新连接失败:', error);
      connection.destroy();
    }
  });

  // 监听连接销毁事件
  connection.on('destroy', () => {
    console.log('语音连接被销毁，清理资源');
    connection.receiver.speaking.removeListener('start', handleSpeaking);
    connection.destroy();
  });

  message.reply('已连接到语音频道，开始监听语音输入。');
  console.log('语音频道处理设置完成');
}

// 事件监听器
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  console.log(`收到消息: ${message.content}`);
  if (message.content.startsWith(process.env.PREFIX)) {
    console.log('检测到命令前缀');
    const command = message.content.slice(process.env.PREFIX.length).trim();
    console.log(`解析到命令: ${command}`);
    if (command === 'join') {
      await handleVoiceChannel(message);
    } else {
      await handleMessage(message);
    }
  }
});

// 启动机器人
client.login(process.env.DISCORD_TOKEN);