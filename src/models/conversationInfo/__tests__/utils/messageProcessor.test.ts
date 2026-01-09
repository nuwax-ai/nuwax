/**
 * messageProcessor 工具函数测试
 */

import { MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  completeIncompleteMessages,
  processErrorEvent,
  processFinalResultEvent,
  processMessageEvent,
  stopActiveMessages,
  updateMessageInList,
} from '../../utils/messageProcessor';

describe('messageProcessor', () => {
  describe('processMessageEvent', () => {
    const baseMessage: Partial<MessageInfo> = {
      id: 'msg-1',
      text: 'Hello ',
      think: '',
      status: MessageStatusEnum.Loading,
    };

    it('should append text for normal message', () => {
      const data = { text: 'World', type: 'normal', finished: false };
      const result = processMessageEvent(baseMessage as MessageInfo, data);

      expect(result.text).toBe('Hello World');
      expect(result.status).toBe(MessageStatusEnum.Incomplete);
    });

    it('should set Complete status when finished is true', () => {
      const data = { text: '!', type: 'normal', finished: true };
      const result = processMessageEvent(baseMessage as MessageInfo, data);

      expect(result.text).toBe('Hello !');
      expect(result.status).toBe(MessageStatusEnum.Complete);
    });

    it('should append to think for think type', () => {
      const data = {
        text: 'thinking...',
        type: MessageModeEnum.THINK,
        finished: false,
      };
      const result = processMessageEvent(baseMessage as MessageInfo, data);

      expect(result.think).toBe('thinking...');
      expect(result.status).toBe(MessageStatusEnum.Incomplete);
    });

    it('should handle question type with null status when finished', () => {
      const data = {
        text: 'question',
        type: MessageModeEnum.QUESTION,
        finished: true,
      };
      const result = processMessageEvent(baseMessage as MessageInfo, data);

      expect(result.text).toBe('Hello question');
      expect(result.status).toBeNull();
    });
  });

  describe('processFinalResultEvent', () => {
    it('should return Complete status with finalResult', () => {
      const currentMessage = { id: 'msg-1', text: 'test' } as MessageInfo;
      const data = { success: true, outputText: 'result' };
      const requestId = 'req-123';

      const result = processFinalResultEvent(currentMessage, data, requestId);

      expect(result.status).toBe(MessageStatusEnum.Complete);
      expect(result.finalResult).toEqual(data);
      expect(result.requestId).toBe(requestId);
    });
  });

  describe('processErrorEvent', () => {
    it('should return Error status', () => {
      const result = processErrorEvent();
      expect(result.status).toBe(MessageStatusEnum.Error);
    });
  });

  describe('updateMessageInList', () => {
    it('should update specific message in list', () => {
      const messages: MessageInfo[] = [
        { id: '1', text: 'first' } as MessageInfo,
        { id: '2', text: 'second' } as MessageInfo,
      ];

      const result = updateMessageInList(messages, '2', { text: 'updated' });

      expect(result[0].text).toBe('first');
      expect(result[1].text).toBe('updated');
    });

    it('should not modify list if message not found', () => {
      const messages: MessageInfo[] = [
        { id: '1', text: 'first' } as MessageInfo,
      ];

      const result = updateMessageInList(messages, 'not-exist', {
        text: 'updated',
      });

      expect(result[0].text).toBe('first');
    });
  });

  describe('stopActiveMessages', () => {
    it('should stop Loading message', () => {
      const messages: MessageInfo[] = [
        { id: '1', status: MessageStatusEnum.Loading } as MessageInfo,
      ];

      const result = stopActiveMessages(messages);

      expect(result[0].status).toBe(MessageStatusEnum.Stopped);
    });

    it('should stop Incomplete message', () => {
      const messages: MessageInfo[] = [
        { id: '1', status: MessageStatusEnum.Incomplete } as MessageInfo,
      ];

      const result = stopActiveMessages(messages);

      expect(result[0].status).toBe(MessageStatusEnum.Stopped);
    });

    it('should update EXECUTING processing to FAILED', () => {
      const messages: MessageInfo[] = [
        {
          id: '1',
          status: MessageStatusEnum.Loading,
          processingList: [
            { status: ProcessingEnum.EXECUTING },
            { status: ProcessingEnum.FINISHED },
          ],
        } as MessageInfo,
      ];

      const result = stopActiveMessages(messages);

      expect(result[0].processingList[0].status).toBe(ProcessingEnum.FAILED);
      expect(result[0].processingList[1].status).toBe(ProcessingEnum.FINISHED);
    });

    it('should return empty array for empty input', () => {
      const result = stopActiveMessages([]);
      expect(result).toEqual([]);
    });
  });

  describe('completeIncompleteMessages', () => {
    it('should complete Incomplete messages', () => {
      const messages: MessageInfo[] = [
        { id: '1', status: MessageStatusEnum.Incomplete } as MessageInfo,
        { id: '2', status: MessageStatusEnum.Complete } as MessageInfo,
        { id: '3', status: MessageStatusEnum.Incomplete } as MessageInfo,
      ];

      const result = completeIncompleteMessages(messages);

      expect(result[0].status).toBe(MessageStatusEnum.Complete);
      expect(result[1].status).toBe(MessageStatusEnum.Complete);
      expect(result[2].status).toBe(MessageStatusEnum.Complete);
    });
  });
});
