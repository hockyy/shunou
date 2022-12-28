import {analyzeSync, MecabOptions} from "@enjoyjs/node-mecab";
import * as wanakana from 'wanakana';
import {isKana, isKanji} from "wanakana";

function splitOkuriganaSparse(text: string, hiragana: string): any {
  const textPointer = [0, text.length - 1];
  const kanaPointer = [0, hiragana.length - 1];
  const direction = [1, -1];
  const stored = [[], []];
  for (let i = 0; i <= 1; i++) {
    while (textPointer[0] <= textPointer[1]) {
      if (!wanakana.isKanji(text[textPointer[i]])) {
        stored[i].push({
          main: text[textPointer[i]],
          hiragana: wanakana.toHiragana(text[textPointer[i]]),
          romaji: wanakana.toRomaji(text[textPointer[i]]),
          isKana: true
        })
        textPointer[i] += direction[i];
        kanaPointer[i] += direction[i];
      } else break;
    }
  }
  if (textPointer[0] <= textPointer[1]) {
    stored[0].push({
      main: text.substring(textPointer[0], textPointer[1] + 1),
      hiragana: hiragana.substring(kanaPointer[0], kanaPointer[1] + 1),
      romaji: wanakana.toRomaji(hiragana.substring(kanaPointer[0], kanaPointer[1] + 1)),
      isKana: false
    })
  }
  stored[0].concat(stored[1].reverse())
  return stored[0]
}

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

function isMixedJapanese(text: string): boolean {
  return wanakana.isMixed(text)
}

export {getFurigana, isMixedJapanese};