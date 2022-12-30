import * as wanakana from 'wanakana';
import {isKana, isKanji, isMixed, toHiragana, toRomaji} from 'wanakana';
import {spawnSync} from "child_process";

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

function getFurigana(text: string, mecabCommand: string = 'mecab') {
  const sentences = spawnSync(mecabCommand, {input: text, shell: true}).stdout.toString();
  const pairs = [];
  for (const word of sentences.split('\n')) {
    if (word === 'EOS') continue;
    const splittedWord = word.split('\t');
    const origin = splittedWord[0];
    const hiragana = isKana(splittedWord[1]) ? toHiragana(splittedWord[1], {passRomaji: true}) : splittedWord[1];
    const basicForm = splittedWord[3]
    const pos = splittedWord[4]
    pairs.push({
      origin, hiragana, basicForm, pos
    })
  }
  const ret = []
  for (const wordPair of pairs) {
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