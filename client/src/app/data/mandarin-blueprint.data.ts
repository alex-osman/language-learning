import { MandarinBlueprint } from '../interfaces/mandarin-blueprint.interface';

export const MANDARIN_BLUEPRINT_DATA: MandarinBlueprint = {
  sets: {
    '-an': "Anrenee's apartment (entrance, mailroom, hallway, 2F)",
    '-en': 'Cosmos college house (5 friends, house shows)',
    '-ong': 'Bellevue Gym',
    '-e': "Eric's place in Maine",
    '-ou': 'Current Philly house with roommates',
    '-a': 'Scottsdale coworking space in Arizona',
    '-ao': '15 ft travel trailer (currently in warehouse, toured across US/Canada)',
    ei: 'Eisenhower school/high school',
    null: 'Bridgewater home (fallback)',
  },
  tones: {
    '1': 'Outside the entrance',
    '2': 'Kitchen or inside entrance',
    '3': 'Bedroom or living room',
    '4': 'Bathroom',
  },
  actors: [
    { initial: 'b', name: 'Bill Murray', type: 'male' },
    { initial: 'r', name: 'The Rock', type: 'male' },
    { initial: 'g', name: 'Gordon Ramsay', type: 'male' },
    { initial: 'k', name: 'Kim Jong Un', type: 'male' },
    { initial: 'c', name: 'Christopher Walken', type: 'male' },
    { initial: 's', name: 'Snoop Dogg', type: 'male' },
    { initial: 'zh', name: 'Jim Carrey', type: 'male' },
    { initial: 'ø', name: 'Jackie Chan', type: 'male' },
    { initial: 'sh', name: 'Shaq', type: 'male' },
    { initial: 'xi', name: 'Shakira', type: 'female' },
    { initial: 'ni', name: 'Nicole Oringer', type: 'female' },
    { initial: 'ji', name: 'Jamie (your sister)', type: 'female' },
    { initial: 'ru', name: 'Ron Weasley', type: 'fictional' },
    { initial: 'du', name: 'Darth Vader', type: 'fictional' },
    { initial: 'w', name: 'Woody', type: 'fictional' },
  ],
  radicalProps: [
    { radical: '一', prop: 'Razorblade' },
    { radical: '二', prop: 'Twins' },
    { radical: '三' },
    { radical: '丨', prop: 'Gandalf staff' },
    { radical: '十', prop: 'Cross' },
    { radical: '丶' },
    { radical: '半' },
    { radical: '八', prop: 'Magic 8 Ball' },
    { radical: '人', prop: 'Person doing a split' },
    { radical: '亻', prop: 'Mr. T (variant of 人)' },
    { radical: '从', prop: 'Two people' },
    { radical: '午', prop: 'Sundial' },
    { radical: '乛', prop: 'Fishing hook' },
    { radical: '口', prop: 'Rolling Stones mouth' },
    { radical: '中', prop: 'Chinese scepter' },
    { radical: '儿', prop: 'Patrick Star’s big black boots' },
    { radical: '只', prop: 'Lone droid' },
    { radical: '兄', prop: 'Older brother Eric' },
    { radical: '允' },
    { radical: '马' },
    { radical: '乙' },
    { radical: '乞' },
    { radical: '气' },
    { radical: '又' },
    { radical: '日' },
    { radical: '旦' },
    { radical: '早' },
    { radical: '七' },
    { radical: '化' },
    { radical: '、' },
    { radical: '白' },
    { radical: '百' },
    { radical: 'ㄇ' },
    { radical: '今' },
    { radical: '千' },
    { radical: '舌' },
    { radical: '冂' },
    { radical: '月' },
    { radical: '用' },
    { radical: '勺' },
    { radical: '广' },
    { radical: '句' },
    { radical: '子' },
    { radical: '寸' },
    { radical: '小' },
    { radical: '才' },
    { radical: '牙' },
    { radical: '上' },
    { radical: '下' },
    { radical: '点' },
    { radical: '丶丶' },
    { radical: '止' },
    { radical: '正' },
    { radical: '足' },
    { radical: '是' },
    { radical: '目' },
    { radical: '自' },
    { radical: '身' },
    { radical: '乂' },
    { radical: '代' },
    { radical: '戈' },
    { radical: '戉' },
    { radical: '手' },
    { radical: '我' },
    { radical: '木' },
    { radical: '本' },
    { radical: '米' },
    { radical: '呆' },
    { radical: '果' },
    { radical: '禾' },
    { radical: '不' },
    { radical: '么' },
    { radical: '合' },
    { radical: '去' },
    { radical: '寺' },
    { radical: '竹' },
    { radical: '笑' },
    { radical: '门' },
    { radical: '问' },
    { radical: '司' },
    { radical: '母' },
    { radical: '也' },
    { radical: '尔' },
    { radical: '大' },
    { radical: '犬' },
    { radical: '刁' },
    { radical: '羊' },
    { radical: '力' },
    { radical: '另' },
    { radical: '丁' },
    { radical: '可' },
    { radical: '奇' },
    { radical: '内' },
    { radical: '两' },
    { radical: '王' },
    { radical: '主' },
    { radical: '玉' },
    { radical: '因' },
    { radical: '讠' },
    { radical: '钅' },
    { radical: '天' },
    { radical: '关' },
    { radical: '并' },
    { radical: '开' },
    { radical: '耳' },
    { radical: '弋' },
    { radical: '玄' },
    { radical: '女' },
    { radical: '西' },
    { radical: '取' },
    { radical: '曼' },
    { radical: '支' },
    { radical: '皮' },
    { radical: '有' },
    { radical: '友' },
    { radical: '言' },
    { radical: '义' },
    { radical: '文' },
    { radical: '父' },
    { radical: '交' },
    { radical: '攵' },
    { radical: '衣' },
    { radical: '衤' },
    { radical: '长' },
    { radical: '良' },
    { radical: '卜' },
    { radical: '元' },
    { radical: '个' },
    { radical: '完' },
    { radical: '比' },
    { radical: '此' },
    { radical: '夕' },
    { radical: '多' },
    { radical: '万' },
    { radical: '少' },
    { radical: '贝' },
    { radical: '页' },
    { radical: '见' },
    { radical: '首' },
    { radical: '直' },
    { radical: '甘' },
    { radical: '其' },
    { radical: '厂' },
    { radical: '反' },
    { radical: '工' },
    { radical: '士' },
    { radical: '纟' },
    { radical: '约' },
    { radical: '穴' },
    { radical: '刀' },
    { radical: '分' },
    { radical: '召' },
    { radical: '至' },
    { radical: '井' },
    { radical: '山' },
    { radical: '亦' },
    { radical: '田' },
    { radical: '牛' },
    { radical: '采' },
    { radical: '隹' },
    { radical: '古' },
    { radical: '考' },
    { radical: '者' },
    { radical: '孝' },
    { radical: '五' },
    { radical: '水' },
    { radical: '求' },
    { radical: '火' },
  ],
  characters: [
    {
      character: '一',
      pinyin: 'yī',
      definition: 'One',
    },
    {
      character: '二',
      pinyin: 'èr',
      definition: 'Two',
    },
    {
      character: '三',
      pinyin: 'sān',
      definition: 'Three',
    },
    {
      character: '十',
      pinyin: 'shí',
      definition: 'Ten',
    },
    {
      character: '干',
      pinyin: 'gān',
      definition: 'Dry',
    },
    {
      character: '半',
      pinyin: 'bàn',
      definition: 'Half',
    },
    {
      character: '人',
      pinyin: 'rén',
      definition: 'Person',
    },
    {
      character: '从',
      pinyin: 'cóng',
      definition: 'Follow',
    },
    {
      character: '个',
      pinyin: 'gè',
      definition: 'Individual',
    },
    {
      character: '入',
      pinyin: 'rù',
      definition: 'Enter',
    },
    {
      character: '什',
      pinyin: 'shén',
      definition: 'What',
    },
    {
      character: '午',
      pinyin: 'wǔ',
      definition: 'Noon',
    },
    {
      character: '年',
      pinyin: 'nián',
      definition: 'Year',
    },
    {
      character: '口',
      pinyin: 'kǒu',
      definition: 'Mouth',
    },
    {
      character: '中',
      pinyin: 'zhōng',
      definition: 'Center',
    },
    {
      character: '叫',
      pinyin: 'jiào',
      definition: 'Call',
    },
    {
      character: '八',
      pinyin: 'bā',
      definition: 'Eight',
    },
    {
      character: '只',
      pinyin: 'zhǐ',
      definition: 'Only',
    },
    {
      character: '介',
      pinyin: 'jiè',
      definition: 'Introduction',
    },
    {
      character: '儿',
      pinyin: 'ér',
      definition: 'Child/Kid',
    },
    {
      character: '四',
      pinyin: 'sì',
      definition: 'Four',
    },
    {
      character: '兄',
      pinyin: 'xiōng',
      definition: 'Elder brother',
    },
    {
      character: '兑',
      pinyin: 'duì',
      definition: 'Exchange',
    },
    {
      character: '说',
    },
    {
      character: '计',
    },
    {
      character: '认',
    },
    {
      character: '识',
    },
    {
      character: '马',
    },
    {
      character: '吗',
    },
    {
      character: '骂',
    },
    {
      character: '乙',
    },
    {
      character: '乞',
    },
    {
      character: '吃',
    },
    {
      character: '气',
    },
    {
      character: '飞',
    },
    {
      character: '况',
    },
    {
      character: '日',
    },
    {
      character: '旧',
    },
    {
      character: '旦',
    },
    {
      character: '但',
    },
    {
      character: '早',
    },
    {
      character: '唱',
    },
    {
      character: '电',
    },
    {
      character: '七',
    },
    {
      character: '化',
    },
    {
      character: '白',
    },
    {
      character: '百',
    },
    {
      character: '今',
    },
    {
      character: '千',
    },
    {
      character: '舌',
    },
    {
      character: '话',
    },
    {
      character: '活',
    },
    {
      character: '乱',
    },
    {
      character: '汽',
    },
    {
      character: '月',
    },
    {
      character: '用',
    },
    {
      character: '胖',
    },
    {
      character: '朋',
    },
    {
      character: '明',
    },
    {
      character: '习',
    },
    {
      character: '句',
    },
    {
      character: '勺',
    },
    {
      character: '的',
    },
    {
      character: '了',
    },
    {
      character: '子',
    },
    {
      character: '寸',
    },
    {
      character: '时',
    },
    {
      character: '过',
    },
    {
      character: '付',
    },
    {
      character: '讨',
    },
    {
      character: '才',
    },
    {
      character: '牙',
    },
    {
      character: '卜',
    },
    {
      character: '上',
    },
    {
      character: '下',
    },
    {
      character: '卡',
    },
    {
      character: '吓',
    },
    {
      character: '占',
    },
    {
      character: '点',
    },
    {
      character: '让',
    },
    {
      character: '止',
    },
    {
      character: '正',
    },
    {
      character: '是',
    },
    {
      character: '目',
    },
    {
      character: '自',
    },
    {
      character: '面',
    },
    {
      character: '身',
    },
    {
      character: '谢',
    },
    {
      character: '弋',
    },
    {
      character: '代',
    },
    {
      character: '戈',
    },
    {
      character: '手',
    },
    {
      character: '我',
    },
    {
      character: '或',
    },
    {
      character: '看',
    },
    {
      character: '担',
    },
    {
      character: '拍',
    },
    {
      character: '提',
    },
    {
      character: '找',
    },
    {
      character: '木',
    },
    {
      character: '本',
    },
    {
      character: '体',
    },
    {
      character: '末',
    },
    {
      character: '米',
    },
    {
      character: '来',
    },
    {
      character: '呆',
    },
    {
      character: '休',
    },
    {
      character: '桌',
    },
    {
      character: '相',
    },
    {
      character: '禾',
    },
    {
      character: '和',
    },
    {
      character: '种',
    },
    {
      character: '香',
    },
    {
      character: '几',
    },
    {
      character: '机',
    },
    {
      character: '心',
    },
    {
      character: '想',
    },
    {
      character: '息',
    },
    {
      character: '总',
    },
    {
      character: '怕',
    },
    {
      character: '己',
    },
    {
      character: '记',
    },
    {
      character: '已',
    },
    {
      character: '包',
    },
    {
      character: '土',
    },
    {
      character: '坐',
    },
    {
      character: '吐',
    },
    {
      character: '肚',
    },
    {
      character: '在',
    },
    {
      character: '走',
    },
    {
      character: '起',
    },
    {
      character: '不',
    },
    {
      character: '还',
    },
    {
      character: '坏',
    },
    {
      character: '杯',
    },
    {
      character: '么',
    },
    {
      character: '公',
    },
    {
      character: '台',
    },
    {
      character: '去',
    },
    {
      character: '丢',
    },
    {
      character: '法',
    },
    {
      character: '寺',
    },
    {
      character: '等',
    },
    {
      character: '门',
    },
    {
      character: '们',
    },
    {
      character: '问',
    },
    {
      character: '间',
    },
    {
      character: '简',
    },
    {
      character: '司',
    },
    {
      character: '词',
    },
    {
      character: '母',
    },
    {
      character: '每',
    },
    {
      character: '也',
    },
    {
      character: '他',
    },
    {
      character: '地',
    },
    {
      character: '小',
    },
    {
      character: '东',
    },
    {
      character: '尔',
    },
    {
      character: '你',
    },
    {
      character: '您',
    },
    {
      character: '大',
    },
    {
      character: '太',
    },
    {
      character: '犬',
    },
    {
      character: '哭',
    },
    {
      character: '臭',
    },
    {
      character: '然',
    },
    {
      character: '狗',
    },
    {
      character: '决',
    },
    {
      character: '快',
    },
    {
      character: '块',
    },
    {
      character: '羊',
    },
    {
      character: '着',
    },
    {
      character: '样',
    },
    {
      character: '美',
    },
    {
      character: '力',
    },
    {
      character: '加',
    },
    {
      character: '边',
    },
    {
      character: '办',
    },
    {
      character: '为',
    },
    {
      character: '另',
    },
    {
      character: '云',
    },
    {
      character: '运',
    },
    {
      character: '动',
    },
    {
      character: '会',
    },
    {
      character: '丁',
    },
    {
      character: '打',
    },
    {
      character: '可',
    },
    {
      character: '哥',
    },
    {
      character: '河',
    },
    {
      character: '奇',
    },
    {
      character: '骑',
    },
    {
      character: '椅',
    },
    {
      character: '以',
    },
    {
      character: '内',
    },
    {
      character: '肉',
    },
    {
      character: '两',
    },
    {
      character: '再',
    },
    {
      character: '同',
    },
    {
      character: '周',
    },
    {
      character: '王',
    },
    {
      character: '全',
    },
    {
      character: '主',
    },
    {
      character: '住',
    },
    {
      character: '注',
    },
    {
      character: '玉',
    },
    {
      character: '国',
    },
    {
      character: '回',
    },
    {
      character: '因',
    },
    {
      character: '嗯',
    },
    {
      character: '行',
    },
    {
      character: '得',
    },
    {
      character: '往',
    },
    {
      character: '金',
    },
    {
      character: '钟',
    },
    {
      character: '天',
    },
    {
      character: '关',
    },
    {
      character: '送',
    },
    {
      character: '开',
    },
    {
      character: '算',
    },
    {
      character: '并',
    },
    {
      character: '耳',
    },
    {
      character: '闻',
    },
    {
      character: '联',
    },
    {
      character: '系',
    },
    {
      character: '女',
    },
    {
      character: '妈',
    },
    {
      character: '好',
    },
    {
      character: '始',
    },
    {
      character: '西',
    },
    {
      character: '要',
    },
    {
      character: '如',
    },
    {
      character: '她',
    },
    {
      character: '楼',
    },
    {
      character: '又',
    },
    {
      character: '汉',
    },
    {
      character: '对',
    },
    {
      character: '没',
    },
    {
      character: '取',
    },
    {
      character: '最',
    },
    {
      character: '曼',
    },
    {
      character: '慢',
    },
    {
      character: '支',
    },
    {
      character: '皮',
    },
    {
      character: '书',
    },
    {
      character: '有',
    },
    {
      character: '随',
    },
    {
      character: '友',
    },
    {
      character: '发',
    },
    {
      character: '六',
    },
    {
      character: '言',
    },
    {
      character: '信',
    },
    {
      character: '文',
    },
    {
      character: '这',
    },
    {
      character: '父',
    },
    {
      character: '交',
    },
    {
      character: '校',
    },
    {
      character: '风',
    },
    {
      character: '网',
    },
    {
      character: '那',
    },
    {
      character: '哪',
    },
    {
      character: '衣',
    },
    {
      character: '袋',
    },
    {
      character: '被',
    },
    {
      character: '艮',
    },
    {
      character: '很',
    },
    {
      character: '银',
    },
    {
      character: '长',
    },
    {
      character: '报',
    },
    {
      character: '服',
    },
    {
      character: '元',
    },
    {
      character: '远',
    },
    {
      character: '玩',
    },
    {
      character: '园',
    },
    {
      character: '完',
    },
    {
      character: '院',
    },
    {
      character: '字',
    },
    {
      character: '定',
    },
    {
      character: '安',
    },
    {
      character: '寄',
    },
    {
      character: '宝',
    },
    {
      character: '匕',
    },
    {
      character: '比',
    },
    {
      character: '它',
    },
    {
      character: '此',
    },
    {
      character: '些',
    },
    {
      character: '能',
    },
    {
      character: '夕',
    },
    {
      character: '多',
    },
    {
      character: '名',
    },
    {
      character: '够',
    },
    {
      character: '外',
    },
    {
      character: '歹',
    },
    {
      character: '死',
    },
    {
      character: '少',
    },
    {
      character: '吵',
    },
    {
      character: '步',
    },
    {
      character: '贝',
    },
    {
      character: '员',
    },
    {
      character: '贵',
    },
    {
      character: '页',
    },
    {
      character: '题',
    },
    {
      character: '见',
    },
    {
      character: '现',
    },
    {
      character: '首',
    },
    {
      character: '道',
    },
    {
      character: '直',
    },
    {
      character: '真',
    },
    {
      character: '廿',
    },
    {
      character: '甘',
    },
    {
      character: '某',
    },
    {
      character: '其',
    },
    {
      character: '期',
    },
    {
      character: '厂',
    },
    {
      character: '厌',
    },
    {
      character: '斤',
    },
    {
      character: '听',
    },
    {
      character: '近',
    },
    {
      character: '诉',
    },
    {
      character: '后',
    },
    {
      character: '厚',
    },
    {
      character: '反',
    },
    {
      character: '饭',
    },
    {
      character: '饱',
    },
    {
      character: '饿',
    },
    {
      character: '工',
    },
    {
      character: '江',
    },
    {
      character: '左',
    },
    {
      character: '右',
    },
    {
      character: '差',
    },
    {
      character: '红',
    },
    {
      character: '约',
    },
    {
      character: '合',
    },
    {
      character: '给',
    },
    {
      character: '拿',
    },
    {
      character: '穴',
    },
    {
      character: '穿',
    },
    {
      character: '空',
    },
    {
      character: '深',
    },
    {
      character: '式',
    },
    {
      character: '试',
    },
    {
      character: '刀',
    },
    {
      character: '分',
    },
    {
      character: '份',
    },
    {
      character: '切',
    },
    {
      character: '划',
    },
    {
      character: '别',
    },
    {
      character: '刚',
    },
    {
      character: '班',
    },
    {
      character: '前',
    },
    {
      character: '召',
    },
    {
      character: '绍',
    },
    {
      character: '照',
    },
    {
      character: '片',
    },
    {
      character: '至',
    },
    {
      character: '到',
    },
    {
      character: '井',
    },
    {
      character: '进',
    },
    {
      character: '山',
    },
    {
      character: '出',
    },
    {
      character: '岁',
    },
    {
      character: '亦',
    },
    {
      character: '变',
    },
    {
      character: '田',
    },
    {
      character: '果',
    },
    {
      character: '课',
    },
    {
      character: '思',
    },
    {
      character: '单',
    },
    {
      character: '鱼',
    },
    {
      character: '男',
    },
    {
      character: '累',
    },
    {
      character: '花',
    },
    {
      character: '草',
    },
    {
      character: '猫',
    },
    {
      character: '药',
    },
    {
      character: '宽',
    },
    {
      character: '采',
    },
    {
      character: '菜',
    },
    {
      character: '受',
    },
    {
      character: '爱',
    },
    {
      character: '共',
    },
    {
      character: '借',
    },
    {
      character: '错',
    },
    {
      character: '收',
    },
    {
      character: '改',
    },
    {
      character: '数',
    },
    {
      character: '古',
    },
    {
      character: '苦',
    },
    {
      character: '做',
    },
    {
      character: '者',
    },
    {
      character: '猪',
    },
    {
      character: '都',
    },
    {
      character: '老',
    },
    {
      character: '孝',
    },
    {
      character: '教',
    },
    {
      character: '五',
    },
    {
      character: '语',
    },
    {
      character: '广',
    },
    {
      character: '床',
    },
    {
      character: '店',
    },
    {
      character: '应',
    },
    {
      character: '兴',
    },
    {
      character: '学',
    },
    {
      character: '觉',
    },
    {
      character: '亥',
    },
    {
      character: '该',
    },
    {
      character: '孩',
    },
    {
      character: '水',
    },
    {
      character: '冰',
    },
    {
      character: '求',
    },
    {
      character: '球',
    },
    {
      character: '救',
    },
    {
      character: '火',
    },
    {
      character: '灯',
    },
    {
      character: '烦',
    },
    {
      character: '里',
    },
    {
      character: '重',
    },
    {
      character: '懂',
    },
    {
      character: '黑',
    },
    {
      character: '乍',
    },
    {
      character: '作',
    },
    {
      character: '昨',
    },
    {
      character: '怎',
    },
    {
      character: '窄',
    },
    {
      character: '丰',
    },
    {
      character: '青',
    },
    {
      character: '请',
    },
    {
      character: '情',
    },
    {
      character: '表',
    },
    {
      character: '生',
    },
    {
      character: '星',
    },
    {
      character: '姓',
    },
    {
      character: '免',
    },
    {
      character: '晚',
    },
    {
      character: '家',
    },
    {
      character: '象',
    },
    {
      character: '像',
    },
    {
      character: '头',
    },
    {
      character: '实',
    },
    {
      character: '买',
    },
    {
      character: '卖',
    },
    {
      character: '读',
    },
    {
      character: '牛',
    },
    {
      character: '特',
    },
    {
      character: '件',
    },
    {
      character: '告',
    },
    {
      character: '先',
    },
    {
      character: '洗',
    },
    {
      character: '角',
    },
    {
      character: '解',
    },
    {
      character: '当',
    },
    {
      character: '扫',
    },
    {
      character: '事',
    },
    {
      character: '史',
    },
    {
      character: '使',
    },
    {
      character: '更',
    },
    {
      character: '便',
    },
    {
      character: '石',
    },
    {
      character: '硬',
    },
    {
      character: '车',
    },
    {
      character: '连',
    },
    {
      character: '辆',
    },
    {
      character: '较',
    },
    {
      character: '轻',
    },
    {
      character: '经',
    },
    {
      character: '与',
    },
    {
      character: '写',
    },
    {
      character: '士',
    },
    {
      character: '任',
    },
    {
      character: '豆',
    },
    {
      character: '喜',
    },
    {
      character: '高',
    },
    {
      character: '搞',
    },
    {
      character: '亭',
    },
    {
      character: '停',
    },
    {
      character: '九',
    },
    {
      character: '丸',
    },
    {
      character: '执',
    },
    {
      character: '热',
    },
    {
      character: '京',
    },
    {
      character: '景',
    },
    {
      character: '影',
    },
    {
      character: '尤',
    },
    {
      character: '就',
    },
    {
      character: '成',
    },
    {
      character: '城',
    },
    {
      character: '越',
    },
    {
      character: '咸',
    },
    {
      character: '感',
    },
    {
      character: '钱',
    },
    {
      character: '浅',
    },
    {
      character: '巾',
    },
    {
      character: '帅',
    },
    {
      character: '师',
    },
    {
      character: '市',
    },
    {
      character: '带',
    },
    {
      character: '邦',
    },
    {
      character: '帮',
    },
    {
      character: '常',
    },
    {
      character: '非',
    },
    {
      character: '雨',
    },
    {
      character: '雪',
    },
    {
      character: '冬',
    },
    {
      character: '图',
    },
    {
      character: '各',
    },
    {
      character: '客',
    },
    {
      character: '务',
    },
    {
      character: '备',
    },
    {
      character: '夏',
    },
    {
      character: '令',
    },
    {
      character: '冷',
    },
    {
      character: '足',
    },
    {
      character: '跑',
    },
    {
      character: '路',
    },
    {
      character: '跟',
    },
    {
      character: '示',
    },
    {
      character: '票',
    },
    {
      character: '视',
    },
    {
      character: '知',
    },
    {
      character: '短',
    },
    {
      character: '医',
    },
    {
      character: '矮',
    },
    {
      character: '侯',
    },
    {
      character: '候',
    },
    {
      character: '弓',
    },
    {
      character: '张',
    },
    {
      character: '虫',
    },
    {
      character: '虽',
    },
    {
      character: '强',
    },
    {
      character: '弱',
    },
    {
      character: '弟',
    },
    {
      character: '第',
    },
    {
      character: '隹',
    },
    {
      character: '谁',
    },
    {
      character: '推',
    },
    {
      character: '难',
    },
    {
      character: '准',
    },
    {
      character: '夭',
    },
    {
      character: '笑',
    },
    {
      character: '立',
    },
    {
      character: '位',
    },
    {
      character: '音',
    },
    {
      character: '意',
    },
    {
      character: '站',
    },
    {
      character: '拉',
    },
    {
      character: '接',
    },
    {
      character: '亲',
    },
    {
      character: '新',
    },
    {
      character: '杀',
    },
    {
      character: '条',
    },
    {
      character: '乐',
    },
    {
      character: '茶',
    },
    {
      character: '乃',
    },
    {
      character: '扔',
    },
    {
      character: '奶',
    },
    {
      character: '及',
    },
    {
      character: '尸',
    },
    {
      character: '呢',
    },
    {
      character: '户',
    },
    {
      character: '所',
    },
    {
      character: '声',
    },
    {
      character: '欠',
    },
    {
      character: '吹',
    },
    {
      character: '歌',
    },
    {
      character: '软',
    },
    {
      character: '次',
    },
    {
      character: '欢',
    },
    {
      character: '亡',
    },
    {
      character: '忘',
    },
    {
      character: '忙',
    },
    {
      character: '万',
    },
    {
      character: '方',
    },
    {
      character: '放',
    },
    {
      character: '房',
    },
    {
      character: '巴',
    },
    {
      character: '吧',
    },
    {
      character: '把',
    },
    {
      character: '色',
    },
    {
      character: '而',
    },
    {
      character: '需',
    },
    {
      character: '且',
    },
    {
      character: '姐',
    },
    {
      character: '宜',
    },
    {
      character: '丙',
    },
    {
      character: '病',
    },
    {
      character: '疼',
    },
    {
      character: '氏',
    },
    {
      character: '纸',
    },
    {
      character: '低',
    },
    {
      character: '北',
    },
    {
      character: '南',
    },
    {
      character: '垂',
    },
    {
      character: '睡',
    },
  ],
};
