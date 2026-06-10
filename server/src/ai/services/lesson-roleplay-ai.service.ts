import { Injectable, Logger } from '@nestjs/common';
import { BaseAiService } from './base-ai.service';
import { LessonRoleplayRequestDto } from '../dto/lesson-roleplay-request.dto';
import { LessonRoleplayResponseDto } from '../dto/lesson-roleplay-response.dto';

@Injectable()
export class LessonRoleplayAiService extends BaseAiService {
  private readonly logger = new Logger(LessonRoleplayAiService.name);

  async generateRoleplayTurn(request: LessonRoleplayRequestDto): Promise<LessonRoleplayResponseDto> {
    const messages = [
      { role: 'system' as const, content: this.buildSystemPrompt(request) },
      ...this.historyMessages(request),
      { role: 'user' as const, content: request.learnerMessage },
    ];

    const completion = await this.chat({
      model: this.CHAT_MODEL,
      messages,
      max_completion_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    try {
      const parsed = JSON.parse(content) as Partial<LessonRoleplayResponseDto>;
      return {
        chinese: parsed.chinese?.trim() || request.context.openingLine.chinese,
        pinyin: parsed.pinyin?.trim() || request.context.openingLine.pinyin,
        english: parsed.english?.trim() || request.context.openingLine.english,
      };
    } catch (error) {
      this.logger.error(`Failed to parse roleplay response: ${content}`);
      throw error;
    }
  }

  private buildSystemPrompt(request: LessonRoleplayRequestDto): string {
    return `You are a friendly Mandarin tutor running a flowing beginner roleplay.

Lesson: ${request.lessonNumber} - ${request.context.title}
Scenario: ${request.context.scenario}

Conversation goals:
${request.context.conversationGoals.map((goal) => `- ${goal}`).join('\n')}

Target patterns:
${request.context.targetPatterns.map((pattern) => `- ${pattern}`).join('\n')}

Allowed vocabulary to prefer:
${request.context.allowedVocabulary.join('、')}

Rules:
- Keep the conversation moving. Do not stop for explicit correction.
- The learner may answer in Chinese or English. Infer their intent.
- Reply with one short tutor turn in simple Mandarin.
- Stay mostly within the lesson's family vocabulary and target patterns.
- Lightly model a more natural/correct phrasing inside your reply when helpful.
- Ask a simple follow-up question unless the conversation is naturally wrapping up.
- Return only valid JSON with keys: chinese, pinyin, english.
- Do not include markdown, explanations, coaching notes, or extra keys.`;
  }

  private historyMessages(request: LessonRoleplayRequestDto) {
    return request.conversationHistory.slice(-10).map((turn) => {
      if (turn.speaker === 'learner') {
        return { role: 'user' as const, content: turn.text || '' };
      }
      return {
        role: 'assistant' as const,
        content: JSON.stringify({
          chinese: turn.chinese || '',
          pinyin: turn.pinyin || '',
          english: turn.english || '',
        }),
      };
    });
  }
}
