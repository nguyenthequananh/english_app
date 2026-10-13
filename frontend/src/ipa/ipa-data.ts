export interface IpaSound { symbol: string; example: string }
export interface IpaGroup { title: string; sounds: IpaSound[] }

export const IPA_GROUPS: IpaGroup[] = [
  { title: 'Nguyên âm đơn', sounds: [
    { symbol: 'iː', example: 'sheep' }, { symbol: 'ɪ', example: 'ship' }, { symbol: 'ʊ', example: 'good' },
    { symbol: 'uː', example: 'shoot' }, { symbol: 'e', example: 'bed' }, { symbol: 'ə', example: 'teacher' },
    { symbol: 'ɜː', example: 'bird' }, { symbol: 'ɔː', example: 'door' }, { symbol: 'æ', example: 'cat' },
    { symbol: 'ʌ', example: 'up' }, { symbol: 'ɑː', example: 'far' }, { symbol: 'ɒ', example: 'on' },
  ] },
  { title: 'Nguyên âm đôi', sounds: [
    { symbol: 'ɪə', example: 'here' }, { symbol: 'eɪ', example: 'wait' }, { symbol: 'ʊə', example: 'tour' },
    { symbol: 'ɔɪ', example: 'boy' }, { symbol: 'əʊ', example: 'show' }, { symbol: 'eə', example: 'hair' },
    { symbol: 'aɪ', example: 'my' }, { symbol: 'aʊ', example: 'cow' },
  ] },
  { title: 'Phụ âm', sounds: [
    { symbol: 'p', example: 'pea' }, { symbol: 'b', example: 'boat' }, { symbol: 't', example: 'tea' },
    { symbol: 'd', example: 'dog' }, { symbol: 'tʃ', example: 'cheese' }, { symbol: 'dʒ', example: 'June' },
    { symbol: 'k', example: 'car' }, { symbol: 'ɡ', example: 'go' }, { symbol: 'f', example: 'fly' },
    { symbol: 'v', example: 'video' }, { symbol: 'θ', example: 'think' }, { symbol: 'ð', example: 'this' },
    { symbol: 's', example: 'see' }, { symbol: 'z', example: 'zoo' }, { symbol: 'ʃ', example: 'shall' },
    { symbol: 'ʒ', example: 'television' }, { symbol: 'm', example: 'man' }, { symbol: 'n', example: 'now' },
    { symbol: 'ŋ', example: 'sing' }, { symbol: 'h', example: 'hat' }, { symbol: 'l', example: 'love' },
    { symbol: 'r', example: 'red' }, { symbol: 'w', example: 'wet' }, { symbol: 'j', example: 'yes' },
  ] },
];
