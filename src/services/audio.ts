import { SUCCESS_CODE } from '@/constants/codes.constants';
import { AUDIO_STT_URL } from '@/constants/common.constants';
import { request } from 'umi';

/**
 * 语音转文字（Speech To Text）
 *
 * 将录音 WAV Blob 通过 multipart/form-data 上传到后端 /api/audio/stt，
 * 返回识别出的文本。鉴权（Bearer token）与 Content-Type 由全局请求拦截器统一处理，
 * 此处无需手动设置（见 services/common.ts 的 requestInterceptors）。
 *
 * 后端响应结构：{ code: '0000', data: { text: string } }
 */

export interface SttResponse {
  code: string;
  data?: {
    text?: string;
  };
  msg?: string;
}

/**
 * 调用语音识别接口
 * @param audioBlob 录音产生的音频 Blob（建议 16kHz/单声道/16bit WAV）
 * @param filename  上传文件名（扩展名决定后端格式识别，默认 .wav）
 * @returns 识别出的文字
 */
export const speechToText = async (
  audioBlob: Blob,
  filename = 'recording.wav',
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', audioBlob, filename);

  const res = await request<SttResponse>(AUDIO_STT_URL, {
    method: 'POST',
    data: formData,
    timeout: 30000,
    // 响应由全局拦截返回原始信封，交由本函数解析
    getResponse: false,
  });

  if (res?.code === SUCCESS_CODE) {
    return res.data?.text ?? '';
  }
  throw new Error(res?.msg || 'speech to text failed');
};
