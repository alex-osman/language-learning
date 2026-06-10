import { TutorContent, TutorLine, TutorWord } from './lesson-tutor-content.types';

const LESSON_1_WORDS: Array<Pick<TutorWord, 'word' | 'pinyin' | 'partOfSpeech' | 'definition' | 'isProperNoun' | 'sourceOrder'>> = [
  { sourceOrder: 1, word: '你', pinyin: 'nǐ', partOfSpeech: 'pr', definition: 'you', isProperNoun: false },
  { sourceOrder: 2, word: '好', pinyin: 'hǎo', partOfSpeech: 'adj', definition: 'fine; good; nice; OK', isProperNoun: false },
  { sourceOrder: 3, word: '请', pinyin: 'qǐng', partOfSpeech: 'v', definition: 'please; to invite', isProperNoun: false },
  { sourceOrder: 4, word: '问', pinyin: 'wèn', partOfSpeech: 'v', definition: 'to ask', isProperNoun: false },
  { sourceOrder: 5, word: '贵', pinyin: 'guì', partOfSpeech: 'adj', definition: 'honorable; expensive', isProperNoun: false },
  { sourceOrder: 6, word: '姓', pinyin: 'xìng', partOfSpeech: 'v/n', definition: 'to be surnamed; surname', isProperNoun: false },
  { sourceOrder: 7, word: '我', pinyin: 'wǒ', partOfSpeech: 'pr', definition: 'I; me', isProperNoun: false },
  { sourceOrder: 8, word: '呢', pinyin: 'ne', partOfSpeech: 'qp', definition: 'question particle', isProperNoun: false },
  { sourceOrder: 9, word: '小姐', pinyin: 'xiǎojiě', partOfSpeech: 'n', definition: 'Miss; young lady', isProperNoun: false },
  { sourceOrder: 10, word: '叫', pinyin: 'jiào', partOfSpeech: 'v', definition: 'to be called; to call', isProperNoun: false },
  { sourceOrder: 11, word: '什么', pinyin: 'shénme', partOfSpeech: 'qpr', definition: 'what', isProperNoun: false },
  { sourceOrder: 12, word: '名字', pinyin: 'míngzi', partOfSpeech: 'n', definition: 'name', isProperNoun: false },
  { sourceOrder: 13, word: '先生', pinyin: 'xiānsheng', partOfSpeech: 'n', definition: 'Mr.; husband; teacher', isProperNoun: false },
  { sourceOrder: 14, word: '李友', pinyin: 'Lǐ Yǒu', partOfSpeech: 'pn', definition: 'personal name', isProperNoun: true },
  { sourceOrder: 15, word: '李', pinyin: 'Lǐ', partOfSpeech: 'pn', definition: 'surname; plum', isProperNoun: true },
  { sourceOrder: 16, word: '王朋', pinyin: 'Wáng Péng', partOfSpeech: 'pn', definition: 'personal name', isProperNoun: true },
  { sourceOrder: 17, word: '王', pinyin: 'Wáng', partOfSpeech: 'pn', definition: 'surname; king', isProperNoun: true },
  { sourceOrder: 18, word: '是', pinyin: 'shì', partOfSpeech: 'v', definition: 'to be', isProperNoun: false },
  { sourceOrder: 19, word: '老师', pinyin: 'lǎoshī', partOfSpeech: 'n', definition: 'teacher', isProperNoun: false },
  { sourceOrder: 20, word: '吗', pinyin: 'ma', partOfSpeech: 'qp', definition: 'question particle', isProperNoun: false },
  { sourceOrder: 21, word: '不', pinyin: 'bù', partOfSpeech: 'adv', definition: 'not; no', isProperNoun: false },
  { sourceOrder: 22, word: '学生', pinyin: 'xuésheng', partOfSpeech: 'n', definition: 'student', isProperNoun: false },
  { sourceOrder: 23, word: '也', pinyin: 'yě', partOfSpeech: 'adv', definition: 'too; also', isProperNoun: false },
  { sourceOrder: 24, word: '人', pinyin: 'rén', partOfSpeech: 'n', definition: 'person; people', isProperNoun: false },
  { sourceOrder: 25, word: '中国', pinyin: 'Zhōngguó', partOfSpeech: 'pn', definition: 'China', isProperNoun: true },
  { sourceOrder: 26, word: '北京', pinyin: 'Běijīng', partOfSpeech: 'pn', definition: 'Beijing', isProperNoun: true },
  { sourceOrder: 27, word: '美国', pinyin: 'Měiguó', partOfSpeech: 'pn', definition: 'America', isProperNoun: true },
  { sourceOrder: 28, word: '纽约', pinyin: 'Niǔyuē', partOfSpeech: 'pn', definition: 'New York', isProperNoun: true },
];

const LESSON_1_DIALOGUES: TutorLine[][] = [
  [
    { id: -1, chinese: '你好！', pinyin: 'Nǐ hǎo!', english: 'Hello!', dialogueNumber: 1, sequenceOrder: 1, keyVocab: ['你', '好'] },
    { id: -2, chinese: '你好！', pinyin: 'Nǐ hǎo!', english: 'Hello!', dialogueNumber: 1, sequenceOrder: 2, keyVocab: ['你', '好'] },
    { id: -3, chinese: '请问，你贵姓？', pinyin: 'Qǐng wèn, nǐ guì xìng?', english: 'May I ask, what is your surname?', dialogueNumber: 1, sequenceOrder: 3, keyVocab: ['请', '问', '贵', '姓'] },
    { id: -4, chinese: '我姓李。你呢？', pinyin: 'Wǒ xìng Lǐ. Nǐ ne?', english: 'My surname is Li. How about you?', dialogueNumber: 1, sequenceOrder: 4, keyVocab: ['我', '姓', '李', '呢'] },
    { id: -5, chinese: '我姓王。李小姐，你叫什么名字？', pinyin: 'Wǒ xìng Wáng. Lǐ xiǎojiě, nǐ jiào shénme míngzi?', english: 'My surname is Wang. Miss Li, what is your name?', dialogueNumber: 1, sequenceOrder: 5, keyVocab: ['姓', '王', '小姐', '叫', '什么', '名字'] },
    { id: -6, chinese: '我叫李友。王先生，你叫什么名字？', pinyin: 'Wǒ jiào Lǐ Yǒu. Wáng xiānsheng, nǐ jiào shénme míngzi?', english: 'My name is Li You. Mr. Wang, what is your name?', dialogueNumber: 1, sequenceOrder: 6, keyVocab: ['叫', '李友', '先生', '什么', '名字'] },
    { id: -7, chinese: '我叫王朋。', pinyin: 'Wǒ jiào Wáng Péng.', english: 'My name is Wang Peng.', dialogueNumber: 1, sequenceOrder: 7, keyVocab: ['我', '叫', '王朋'] },
  ],
  [
    { id: -11, chinese: '王先生，你是老师吗？', pinyin: 'Wáng xiānsheng, nǐ shì lǎoshī ma?', english: 'Mr. Wang, are you a teacher?', dialogueNumber: 2, sequenceOrder: 1, keyVocab: ['先生', '是', '老师', '吗'] },
    { id: -12, chinese: '我不是老师，我是学生。李友，你呢？', pinyin: 'Wǒ bú shì lǎoshī, wǒ shì xuésheng. Lǐ Yǒu, nǐ ne?', english: 'I am not a teacher. I am a student. Li You, how about you?', dialogueNumber: 2, sequenceOrder: 2, keyVocab: ['不', '是', '老师', '学生', '呢'] },
    { id: -13, chinese: '我也是学生。你是中国人吗？', pinyin: 'Wǒ yě shì xuésheng. Nǐ shì Zhōngguó rén ma?', english: 'I am also a student. Are you Chinese?', dialogueNumber: 2, sequenceOrder: 3, keyVocab: ['也', '是', '学生', '中国', '人', '吗'] },
    { id: -14, chinese: '是，我是北京人。你是美国人吗？', pinyin: 'Shì, wǒ shì Běijīng rén. Nǐ shì Měiguó rén ma?', english: 'Yes, I am from Beijing. Are you American?', dialogueNumber: 2, sequenceOrder: 4, keyVocab: ['是', '北京', '人', '美国', '吗'] },
    { id: -15, chinese: '是，我是纽约人。', pinyin: 'Shì, wǒ shì Niǔyuē rén.', english: 'Yes, I am from New York.', dialogueNumber: 2, sequenceOrder: 5, keyVocab: ['是', '纽约', '人'] },
  ],
];

export const LESSON_1_TUTOR_CONTENT: TutorContent = {
  lessonNumber: 1,
  title: 'Greetings',
  chineseTitle: '问好',
  pinyinTitle: 'Dì yī kè Wèn hǎo',
  heroCopy: 'Practice first greetings, names, roles, and nationality with short reusable exchanges.',
  sourceNote: 'Source: textbook.pdf Lesson 1',
  detailRoute: '/lessons/1',
  dialogueTitle: 'Dialogue I: Exchanging Greetings',
  dialogueGuide: 'Work through the first meeting line by line: greet, ask surname, and exchange full names.',
  vocabNote: 'Curated from the textbook extract and normalized for Lesson 1 order.',
  words: LESSON_1_WORDS,
  dialogues: LESSON_1_DIALOGUES,
  patterns: [
    { title: '你好', example: '你好！ 你好！', explanation: 'Repeat the same greeting to respond naturally.' },
    { title: '贵姓 / 姓', example: '你贵姓？ 我姓王。', explanation: 'Use 贵姓 politely when asking, but drop 贵 when answering.' },
    { title: '呢', example: '我姓李。你呢？', explanation: 'Use 呢 to ask the same contextual question back.' },
    { title: '叫', example: '你叫什么名字？ 我叫王朋。', explanation: 'Use 叫 to ask or state a full name.' },
    { title: '是 / 不是', example: '你是老师吗？ 我不是老师，我是学生。', explanation: 'Use 是 for identity and 不 before 是 to negate it.' },
    { title: '也', example: '我也是学生。', explanation: 'Use 也 before the verb to say too or also.' },
  ],
  drills: [
    { id: 'surname-answer', prompt: 'Choose the natural answer: 你贵姓？', choices: ['我姓王。', '我贵姓王。', '我叫姓王。'], answer: '我姓王。', selected: '', explanation: '贵 is used politely in the question, but not in the answer.' },
    { id: 'name-question', prompt: 'Which asks for a full name?', choices: ['你叫什么名字？', '你姓什么？', '你是老师吗？'], answer: '你叫什么名字？', selected: '', explanation: '叫什么名字 asks what someone is called, meaning their name.' },
    { id: 'ma-question', prompt: 'Which sentence is a yes/no question?', choices: ['你是学生吗？', '你呢？', '你叫什么名字？'], answer: '你是学生吗？', selected: '', explanation: '吗 turns a statement into a yes/no question.' },
    { id: 'also-student', prompt: 'Complete the sentence: 我___是学生。', choices: ['也', '吗', '呢'], answer: '也', selected: '', explanation: '也 means too/also and appears before 是.' },
  ],
  personalPractice: {
    title: 'My Introduction Builder',
    description: 'Create Lesson 1 lines for greeting someone and introducing your surname, name, role, and place.',
    fields: [
      { key: 'firstText', label: 'Surname', inputType: 'text' },
      { key: 'secondText', label: 'Full name', inputType: 'text' },
    ],
    selectionHeading: 'Identity lines',
    generatedLabel: 'Generated introduction lines',
    storageKey: 'lessonTutor.personalProfile.v1.lesson1',
    defaultProfile: {
      firstNumber: 0,
      secondNumber: 0,
      firstText: '王',
      secondText: '王朋',
      selections: [
        { key: 'student', label: 'Student', chinese: '学生', selected: true, detailText: '' },
        { key: 'teacher', label: 'Teacher', chinese: '老师', selected: false, detailText: '' },
        { key: 'american', label: 'American', chinese: '美国人', selected: true, detailText: '' },
        { key: 'beijing', label: 'Beijing person', chinese: '北京人', selected: false, detailText: '' },
      ],
    },
    sentenceTemplates: [
      {
        kind: 'single',
        parts: [
          { kind: 'literal', value: '你好！' },
        ],
      },
      {
        kind: 'single',
        parts: [
          { kind: 'literal', value: '我姓' },
          { kind: 'profile', key: 'firstText', fallback: '王' },
          { kind: 'literal', value: '。' },
        ],
      },
      {
        kind: 'single',
        parts: [
          { kind: 'literal', value: '我叫' },
          { kind: 'profile', key: 'secondText', fallback: '王朋' },
          { kind: 'literal', value: '。' },
        ],
      },
      {
        kind: 'single',
        parts: [
          { kind: 'literal', value: '我是' },
          { kind: 'selectedValue', key: 'student', field: 'chinese', fallback: '学生' },
          { kind: 'literal', value: '。' },
        ],
      },
      {
        kind: 'single',
        parts: [
          { kind: 'literal', value: '我是' },
          { kind: 'selectedValue', chineseIncludes: '人', field: 'chinese', fallback: '美国人' },
          { kind: 'literal', value: '。' },
        ],
      },
    ],
  },
};
