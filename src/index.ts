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
    if (typeof hiragana === 'undefined') hiragana = text
    else if (hiragana === '*') hiragana = toHiragana(text)
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
    let sentences = spawnSync('"' + mecabCommand + '"', outputFormat !== '' ? ['-O', outputFormat] : [], {
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
    if (splittedSentences.length === 0 || !ok) {
        return notOKParseResponse
    }
    const pairs = []
    for (const tmpWord of splittedSentences) {
        let word = tmpWord;
        if (word[0] === 'B') {
            word = word.substring(1)
            pairs.push({
                origin: '\n', hiragana: '\n', basicForm: '\n', pos: ''
            })
        }
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
        if (word === "EOS") continue;
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
        if (word === "EOS") continue;
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

export interface ShunouWord {
    origin: string;
    hiragana: string;
    basicForm: string;
    pos: string;
}

export interface ShunouSeparation {
    main: string;
    hiragana: string;
    romaji: string;
    isKana: boolean;
    isKanji: boolean;
    isMixed: boolean;
}

export interface ShunouWordWithSeparations extends ShunouWord {
    separation: ShunouSeparation[];
}

export interface KuromojinWord {
    word_id: number;
    word_type: string;
    word_position: number;
    surface_form: string;
    pos: string;
    pos_detail_1: string;
    pos_detail_2: string;
    pos_detail_3: string;
    conjugated_type: string;
    conjugated_form: string;
    basic_form: string;
    reading: string;
    pronunciation: string;
}

export function separate(pairs: ShunouWord[]) {

    const ret: ShunouWordWithSeparations[] = []
    for (const wordPair of pairs) {
        ret.push({
            ...wordPair,
            separation: splitOkuriganaCompact(wordPair.origin, wordPair.hiragana)
        });
    }
    return ret
}

export function getFurigana(text: string, mecabCommand: string = 'mecab'): ShunouWordWithSeparations[] {
    let res: { ok: boolean, pairs: ShunouWord[] } = parseChamame(text, mecabCommand)
    if (!res.ok) {
        res = parseChasen(text, mecabCommand)
        if (!res.ok) {
            res = parseEmpty(text, mecabCommand)
        }
    }
    return separate(res.pairs);
}

function isMixedJapanese(text: string): boolean {
    return isMixed(text)
}

export function kuromojinToShunou(texts: KuromojinWord[]): ShunouWord[] {
    return texts.map(item => {
        const origin = item.surface_form;
        const hiragana = toHiragana(item.pronunciation); // Need to convert to hiragana if it's not
        const basicForm = item.basic_form;
        const pos = item.pos
            + (item.pos_detail_1 !== '*' ? '-' + item.pos_detail_1 : '')
            + (item.pos_detail_2 !== '*' ? '-' + item.pos_detail_2 : '')
            + (item.pos_detail_3 !== '*' ? '-' + item.pos_detail_3 : '');
        return {
            origin,
            hiragana,
            basicForm,
            pos
        };
    });
}

export function processKuromojinToSeparations(texts: KuromojinWord[]): ShunouWordWithSeparations[] {
    const shunouTexts = kuromojinToShunou(texts);
    return separate(shunouTexts);
}