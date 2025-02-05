import paddlespeech
from paddlespeech.cli.tts.infer import TTSExecutor
from paddlespeech.cli.asr.infer import ASRExecutor
import sys
import json

def text_to_speech(text, output_file):
    tts = TTSExecutor()
    tts(
        text=text,
        output=output_file,
        am='fastspeech2_csmsc',
        voc='hifigan_csmsc',
        lang='zh'
    )

def speech_to_text(audio_file):
    print(f'开始处理音频文件: {audio_file}')
    try:
        asr = ASRExecutor()
        print('ASR执行器初始化成功')
        result = asr(
            audio_file=audio_file,
            model='conformer_wenetspeech',
            lang='zh'
        )
        print(f'语音识别结果: {result}')
        return result
    except Exception as e:
        print(f'语音识别过程出错: {str(e)}')
        raise

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "参数不足"}))
        sys.exit(1)

    mode = sys.argv[1]
    if mode == "tts":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "TTS模式需要文本和输出文件路径"}))
            sys.exit(1)
        text = sys.argv[2]
        output_file = sys.argv[3]
        try:
            text_to_speech(text, output_file)
            print(json.dumps({"success": True, "output_file": output_file}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    
    elif mode == "stt":
        audio_file = sys.argv[2]
        try:
            result = speech_to_text(audio_file)
            print(json.dumps({"success": True, "text": result}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    
    else:
        print(json.dumps({"error": "未知的模式"}))
        sys.exit(1)

if __name__ == "__main__":
    main()