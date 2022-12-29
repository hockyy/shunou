import {analyzeSync, MecabOptions} from "@enjoyjs/node-mecab";
import * as wanakana from 'wanakana';
import {isKana, isKanji, isMixed} from "wanakana";
import {spawn, spawnSync} from "child_process";

function splitOkuriganaCompact(text: string, hiragana: string): any {
  const kanjiPointer = [text.length, -1];
  const stored = []
  for (let i = 0; i < text.length + 1; i++) {
    kanjiPointer[0] = i;
    if (i === text.length + 1 || wanakana.isKanji(text[i])) break;
  }
  for (let i = text.length - 1; i >= 0; i--) {
    kanjiPointer[1] = i;
    if (i === -1 || wanakana.isKanji(text[i])) break;
  }
  if (kanjiPointer[0] > 0) {
    const textHiragana = hiragana.substring(0, kanjiPointer[0]);
    const textMain = text.substring(0, kanjiPointer[0])
    stored.push({
      main: textMain,
      hiragana: textHiragana,
      romaji: wanakana.toRomaji(textHiragana),
      isKana: isKana(textMain),
      isKanji: isKanji(textMain),
      isMixed: isMixed(textMain)
    })
  }
  if (kanjiPointer[0] <= kanjiPointer[1]) {
    const spentBack = text.length - kanjiPointer[1];
    const textMain = text.substring(kanjiPointer[0], kanjiPointer[1] + 1)
    const textHiragana = hiragana.substring(kanjiPointer[0], hiragana.length - spentBack + 1)
    stored.push({
      main: textMain,
      hiragana: textHiragana,
      romaji: wanakana.toRomaji(textHiragana),
      isKana: isKana(textMain),
      isKanji: isKanji(textMain),
      isMixed: isMixed(textMain)
    })
  }
  if (kanjiPointer[0] <= kanjiPointer[1] && kanjiPointer[1] + 1 !== text.length) {
    const spentBack = text.length - kanjiPointer[1];
    const textHiragana = hiragana.substring(hiragana.length - spentBack + 1, hiragana.length)
    const textMain = text.substring(kanjiPointer[1] + 1, text.length)
    stored.push({
      main: textMain,
      hiragana: textHiragana,
      romaji: wanakana.toRomaji(textHiragana),
      isKana: isKana(textMain),
      isKanji: isKanji(textMain),
      isMixed: isMixed(textMain)
    })
  }
  return stored;
}

function getFurigana(text: string, options?: Readonly<MecabOptions>) {
  const sentences = analyzeSync(text, options)
  const pairs = [];
  for (const word of sentences.split('\n')) {
    if (word === 'EOS') continue;
    const splittedWord = word.split('\t');
    const origin = splittedWord[0];
    const hiragana = wanakana.isKana(splittedWord[1]) ? wanakana.toHiragana(splittedWord[1], {passRomaji: true}) : splittedWord[1];
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


function getFuriganaNew(text: string, options?: Readonly<MecabOptions>) {
  const sentences = spawnSync( "mecab", { input : 'one two three' }).stdout.toString();
  const pairs = [];
  for (const word of sentences.split('\n')) {
    if (word === 'EOS') continue;
    const splittedWord = word.split('\t');
    const origin = splittedWord[0];
    const hiragana = wanakana.isKana(splittedWord[1]) ? wanakana.toHiragana(splittedWord[1], {passRomaji: true}) : splittedWord[1];
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
  return wanakana.isMixed(text)
}

export {getFurigana, isMixedJapanese};