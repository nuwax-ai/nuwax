import pic from '@/assets/images/pic.jpeg';
import type { ModalSliderCaptchaType } from '@/types/interfaces/login';
import {
  LoadingOutlined,
  MehOutlined,
  RedditOutlined,
  RubyOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Modal } from 'antd';
import createPuzzle from 'create-puzzle';
import SliderCaptcha from 'rc-slider-captcha';
import React, { useRef } from 'react';
import { inRange, sleep } from 'ut2';

const ModalSliderCaptcha: React.FC<ModalSliderCaptchaType> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  // x轴偏移值
  const offsetXRef = useRef<number>(0);

  // 切割生产滑动图片
  const getCaptcha = async () => {
    await sleep(300);
    return createPuzzle(pic as string, {
      format: 'blob',
    }).then((res) => {
      offsetXRef.current = res.x;
      return {
        // 背景图片
        bgUrl: res.bgUrl,
        // 校验区域
        puzzleUrl: res.puzzleUrl,
      };
    });
  };

  // 查看是否在安全距离
  const verifyCaptcha = async (data: { x: number }) => {
    await sleep();
    const start = offsetXRef.current - 5;
    const end = offsetXRef.current + 5;
    if (data && inRange(data.x, start, end)) {
      //  // 生成验证参数
      //  const captchaVerifyParam = {
      //   sessionId: Date.now().toString(), // 使用时间戳作为临时sessionId
      //   sig: '临时签名', // 实际应从阿里云服务端获取
      //   token: '临时token', // 实际应从阿里云服务端获取
      //   scene: 'login' // 根据业务场景设置
      // };
      // console.log('验证码验证参数:', captchaVerifyParam); // 打印验证参数，实际应发送到后端验证
      // return
      onSuccess();
      return Promise.resolve();
    }
    return Promise.reject();
  };

  return (
    <Modal
      open={open}
      onCancel={() => onCancel(false)}
      title="请完成下列验证后继续"
      footer={false}
      destroyOnClose
      width={318}
      centered
    >
      <SliderCaptcha
        request={getCaptcha}
        onVerify={(data) => {
          return verifyCaptcha(data);
        }}
        // bgSize必须和原图片的尺寸一样
        bgSize={{ width: 270, height: 152 }}
        tipIcon={{
          default: <RubyOutlined />,
          loading: <LoadingOutlined />,
          success: <SmileOutlined />,
          error: <MehOutlined />,
          refresh: <RedditOutlined />,
        }}
        tipText={{
          default: '向右拖动完成拼图',
          loading: '努力中...',
          moving: '向右拖动至拼图位置',
          verifying: '验证中...',
          error: '验证失败',
        }}
      />
    </Modal>
  );
};

export default ModalSliderCaptcha;
