import {analyzeSync, MecabOptions} from "@enjoyjs/node-mecab";
import * as wanakana from 'wanakana';


function splitOkurigana(text: string, hiragana: string): any {
  const textPointer = [0, text.length - 1];
  const kanaPointer = [0, hiragana.length - 1];
  const direction = [1, -1];
  const stored = [[], []];
  for (let i = 0; i <= 1; i++) {
    while (textPointer[0] <= textPointer[1]) {
      if (!wanakana.isKanji(text[textPointer[i]])) {
        stored[i].push({
          main: text[textPointer[i]],
          over: null,
          under: wanakana.toRomaji(text[textPointer[i]])
        })
        textPointer[i] += direction[i];
        kanaPointer[i] += direction[i];
      } else break;
    }
  }
  if (textPointer[0] <= textPointer[1]) {
    stored[0].push({
      main: text.substring(textPointer[0], textPointer[1] + 1),
      over: hiragana.substring(kanaPointer[0], kanaPointer[1] + 1),
      under: wanakana.toRomaji(hiragana.substring(kanaPointer[0], kanaPointer[1] + 1))
    })
  }
  stored[0].concat(stored[1].reverse())
  return stored[0]
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
      separation: splitOkurigana(wordPair.origin, wordPair.hiragana)
    });
  }
  return ret
}

function isMixedJapanese(text: string): boolean {
  return wanakana.isMixed(text)
}

export {getFurigana, isMixedJapanese};