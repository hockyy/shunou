import {analyze, MecabOptions} from "@enjoyjs/node-mecab";
import * as wanakana from 'wanakana';


let text;
text = '澱んだ街角で,僕らは出会った'
text = '活版印刷の流れを汲む出版作業では'
text = 'お茶にお煎餅、よく合いますね'
// text = '野ブタ。をプロデュース'
// text = '本当に'

const getFurigana = async (text: string, options?: Readonly<MecabOptions>) => {
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

export {getFurigana}