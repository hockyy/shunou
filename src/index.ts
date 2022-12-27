import {analyze, MecabOptions} from "@enjoyjs/node-mecab";
import * as wanakana from 'wanakana';

async function getFurigana(text: string, options?: Readonly<MecabOptions>) {
    const sentences = await analyze(text, options)
    const words = [];
    for (const word of sentences.split('\n')) {
        if (word === 'EOS') continue;
        // console.log(word)
        const splittedWord = word.split('\t');
        const origin = splittedWord[0];
        const hiragana = wanakana.isKana(splittedWord[1]) ? wanakana.toHiragana(splittedWord[1], {passRomaji: true}) : splittedWord[1];
        words.push({
            origin, hiragana
        })
    }
    return words
}

export {getFurigana};