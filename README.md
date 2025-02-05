# Discord AI Voice Assistant

A powerful Discord AI bot that integrates text chat, speech recognition, and speech synthesis capabilities.

## 🌟 Features

- 💬 Smart Dialogue: Natural language processing powered by DeepSeek API
- 🎙️ Speech Recognition: Real-time speech-to-text support
- 🔊 Speech Synthesis: Text-to-speech capabilities
- 🇨🇳 Chinese Language Support: Complete Chinese voice processing
- 👥 User Classification: Personalized responses for different user groups
- 🎯 Precise Control: Configurable channel and voice channel permissions

## 🛠️ Tech Stack

- **Node.js**
  - discord.js
  - @discordjs/voice
  - openai
- **Python**
  - PaddleSpeech
- **Other Tools**
  - FFmpeg
  - Google Cloud Speech Services

## 📋 Prerequisites

- Node.js 16.x or higher
- Python 3.8 or higher
- FFmpeg

## 🚀 Installation

1. Clone the repository
```bash
git clone https://github.com/max-7189/DiscoedbotWithLLM.git
cd DiscoedbotWithLLM
```

2. Install Node.js dependencies
```bash
npm install
```

3. Install Python dependencies
```bash
pip install paddlespeech
```

4. Configure environment variables
```bash
cp .env.example .env
```
Edit the .env file with the following information:
- DEEPSEEK_API_KEY
- DEEPSEEK_BASE_URL
- DISCORD_TOKEN
- ALLOWED_CHANNELS
- VOICE_CHANNELS
- FRIENDLY_USERS
- GRUMPY_USERS
- CAT_USERS

## 🎮 Usage

1. Start the bot
```bash
npm start
```

2. Using in Discord
- Text Chat: Interact with the bot in allowed text channels
- Voice Features: Join designated voice channels to use voice functionality

## 📝 Configuration

### User Groups
- FRIENDLY_USERS: Users who receive friendly responses
- GRUMPY_USERS: Users who receive serious responses
- CAT_USERS: Users who receive special responses

### Channel Control
- ALLOWED_CHANNELS: Text channels where the bot is allowed to operate
- VOICE_CHANNELS: Voice channels where the bot can join

## 🤝 Contributing

Issues and Pull Requests are welcome to help improve the project.

## 📄 License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 