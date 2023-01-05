import * as wanakana from 'wanakana';
import {isKana, isKanji, isMixed, toHiragana, toRomaji} from 'wanakana';
import {spawnSync} from "child_process";
import {escape} from "querystring";

function anyOneTrue(word: string, func) {
  for (const ch of word) {
    if (func(ch)) return true;
  }
  return false;
}

function createStoredObject(textMain: string, textHiragana: string) {
  return {
    main: textMain,
    hiragana: textHiragana,
    romaji: toRomaji(textHiragana),
    isKana: anyOneTrue(textMain, isKana),
    isKanji: anyOneTrue(textMain, isKanji),
    isMixed: anyOneTrue(textMain, isMixed)
  }
}

function splitOkuriganaCompact(text: string, hiragana: string): any {
  if (typeof hiragana === 'undefined') hiragana = text
  const kanjiPointer = [text.length, -1];
  const stored = []
  for (let i = 0; i < text.length + 1; i++) {
    kanjiPointer[0] = i;
    if (i === text.length + 1 || isKanji(text[i])) break;
  }
  for (let i = text.length - 1; i >= 0; i--) {
    kanjiPointer[1] = i;
    if (i === -1 || isKanji(text[i])) break;
  }
  if (kanjiPointer[0] > 0) {
    const textHiragana = hiragana.substring(0, kanjiPointer[0]);
    const textMain = text.substring(0, kanjiPointer[0])
    stored.push(createStoredObject(textMain, textHiragana))
  }
  if (kanjiPointer[0] <= kanjiPointer[1]) {
    const spentBack = text.length - kanjiPointer[1];
    const textMain = text.substring(kanjiPointer[0], kanjiPointer[1] + 1)
    const textHiragana = hiragana.substring(kanjiPointer[0], hiragana.length - spentBack + 1)
    stored.push(createStoredObject(textMain, textHiragana))
  }
  if (kanjiPointer[0] <= kanjiPointer[1] && kanjiPointer[1] + 1 !== text.length) {
    const spentBack = text.length - kanjiPointer[1];
    const textHiragana = hiragana.substring(hiragana.length - spentBack + 1, hiragana.length)
    const textMain = text.substring(kanjiPointer[1] + 1, text.length)
    stored.push(createStoredObject(textMain, textHiragana))
  }
  return stored;
}

const notOKRunAndSplitResponse = {ok: false, splittedSentences: []};
const runAndSplit = (text: string, mecabCommand: string, outputFormat: string) => {
  text = text.replace(/[^\S\n]/g, ' ')
  text = text.trim()
  let sentences = spawnSync(mecabCommand, outputFormat !== '' ? ['-O', outputFormat] : [], {
    input: text,
    shell: true
  }).stdout.toString();
  const splittedSentences = sentences.split('\n');
  if (splittedSentences.length === 0 || splittedSentences[0].includes(`unkown format type [${outputFormat}]`)) {
    return notOKRunAndSplitResponse;
  }
  while (splittedSentences.length > 0 && splittedSentences[splittedSentences.length - 1] === '') {
    splittedSentences.pop()
  }
  return {ok: true, splittedSentences};
}

const notOKParseResponse = {ok: false, pairs: []};
const parseChamame = (text: string, mecabCommand: string) => {
  const {ok, splittedSentences} = runAndSplit(text, mecabCommand, 'chamame');
  if (splittedSentences.length === 0 || !ok || splittedSentences[0][0] !== 'B') {
    return notOKParseResponse
  }
  const pairs = []
  splittedSentences[0] = splittedSentences[0].substring(1)
  for (const word of splittedSentences) {
    const splittedWord = word.trim('\t').split('\t');
    const origin = splittedWord[0];
    const hiragana = isKana(splittedWord[1]) ? toHiragana(splittedWord[1], {passRomaji: true}) : splittedWord[1];
    const basicForm = splittedWord[3]
    const pos = splittedWord[4]
    pairs.push({
      origin, hiragana, basicForm, pos
    })
  }
  return {ok: true, pairs}
}

const parseChasen = (text: string, mecabCommand: string) => {
  const {ok, splittedSentences} = runAndSplit(text, mecabCommand, 'chasen');
  if (splittedSentences.length === 0 || !ok) {
    return notOKParseResponse
  }
  const pairs = []
  for (const word of splittedSentences) {
    if (word === "EOS") break;
    const splittedWord = word.trim('\t').split('\t');
    const origin = splittedWord[0];
    const hiragana = isKana(splittedWord[1]) ? toHiragana(splittedWord[1], {passRomaji: true}) : splittedWord[1];
    const basicForm = splittedWord[2]
    const pos = splittedWord[3]
    pairs.push({
      origin, hiragana, basicForm, pos
    })
  }
  return {ok: true, pairs}
}

const parseEmpty = (text: string, mecabCommand: string) => {
  const {ok, splittedSentences} = runAndSplit(text, mecabCommand, '');
  if (splittedSentences.length === 0 || !ok) {
    return notOKParseResponse
  }
  const pairs = []
  for (const word of splittedSentences) {
    if (word === "EOS") break;
    const splittedFeature = word.trim('\t').split('\t');
    const origin = splittedFeature[0];
    const splittedWord = splittedFeature[1].split(',');
    const hiragana = isKana(splittedWord[5]) ? toHiragana(splittedWord[5], {passRomaji: true}) : splittedWord[5];
    const basicForm = splittedWord[4]
    const pos = splittedWord[0]
    pairs.push({
      origin, hiragana, basicForm, pos
    })
  }
  return {ok: true, pairs}
}

function getFurigana(text: string, mecabCommand: string = 'mecab') {
  let res = parseChamame(text, mecabCommand)
  if (!res.ok) {
    res = parseChasen(text, mecabCommand)
    if (!res.ok) {
      res = parseEmpty(text, mecabCommand)
    }
  }
  const ret = []
  for (const wordPair of res.pairs) {
    ret.push({
      ...wordPair,
      separation: splitOkuriganaCompact(wordPair.origin, wordPair.hiragana)
    });
  }
  return ret
}

function isMixedJapanese(text: string): boolean {
  return isMixed(text)
}

export {getFurigana, isMixedJapanese};