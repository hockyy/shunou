import {analyze, MecabOptions} from "@enjoyjs/node-mecab";
import * as wanakana from 'wanakana';


function splitOkurigana(text: string, hiragana: string) {
    const textPointer = [0, text.length - 1];
    const kanaPointer = [0, hiragana.length - 1];
    const direction = [1, -1];
    const stored = [[], []];
    for (let i = 0; i <= 1; i++) {
        while (textPointer[0] <= textPointer[1]) {
            if (!wanakana.isKanji(text[textPointer[i]])) {
                stored[i].push({
                    bottom: text[textPointer[i]],
                    top: null
                })
                textPointer[i] += direction[i];
                kanaPointer[i] += direction[i];
            } else break;
        }
    }
    if (textPointer[0] <= textPointer[1]) {
        stored[0].push({
            bottom: text.substring(textPointer[0], textPointer[1] + 1),
            top: hiragana.substring(kanaPointer[0], kanaPointer[1] + 1)
        })
    }
    stored[0].concat(stored[1].reverse())
    return stored[0]
}

async function getFurigana(text: string, options?: Readonly<MecabOptions>) {
    const sentences = await analyze(text, options)
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

export {getFurigana};