# Shunou

## How To Use

```js
import {getFurigana} from "shunou"


// let text = ['澱んだ街角で,僕らは出会った', '活版印刷の流れを汲む出版作業では', 'お茶にお煎餅、よく合いますね', '野ブタ。をプロデュース', '本当に', '平気', '平然', '格好いい', '庭には２羽鶏がいる', '頑張り屋', 'アニメを見ています', '踏み込む']
let text = ['アニメを見ています']
for (const tmp of text) {
    getFurigana(tmp, {dicdir: '/opt/homebrew/lib/mecab/dic/unidic'}).then((val) => {
        // console.log(JSON.stringify(val, null, 2));
        console.log(JSON.stringify(val));
    });
}
```

```json
[{"origin":"アニメ","hiragana":"あにめ","basicForm":"アニメ-animation","pos":"名詞-普通名詞-一般","separation":[{"bottom":"ア","top":null},{"bottom":"ニ","top":null},{"bottom":"メ","top":null}]},{"origin":"を","hiragana":"お","basicForm":"を","pos":"助詞-格助詞","separation":[{"bottom":"を","top":null}]},{"origin":"見","hiragana":"み","basicForm":"見る","pos":"動詞-非自立可能","separation":[{"bottom":"見","top":"み"}]},{"origin":"て","hiragana":"て","basicForm":"て","pos":"助詞-接続助詞","separation":[{"bottom":"て","top":null}]},{"origin":"い","hiragana":"い","basicForm":"居る","pos":"動詞-非自立可能","separation":[{"bottom":"い","top":null}]},{"origin":"ます","hiragana":"ます","basicForm":"ます","pos":"助動詞","separation":[{"bottom":"ま","top":null},{"bottom":"す","top":null}]}]
```

Shunou uses the MeCab tokenizer, which is a binding for the CLI of MeCab. It should be available for EVERY OS!

This repo is heavily referenced by:
- https://github.com/MikimotoH/furigana
- https://github.com/hockyy/nican

## MacOS Setup

- Install `mecab` via brew

## Manual Dictionary for UniDic 

To enable mecab-unidic dictionary, add to`$(brew --prefix)/etc/mecabrc` the below:

- `dicdir = [$(brew --prefix) //Compute this first]/lib/mecab/dic/unidic`

More or less, be like this:

```bash
hocky:~/project/shunou$ cat $(brew --prefix)/etc/mecabrc
;
; Configuration file of MeCab
;
; $Id: mecabrc.in,v 1.3 2006/05/29 15:36:08 taku-ku Exp $;
;
; dicdir =  /opt/homebrew/lib/mecab/dic/ipadic
dicdir = /opt/homebrew/lib/mecab/dic/unidic
; userdic = /home/foo/bar/user.dic

; output-format-type = wakati
; input-buffer-size = 8192

; node-format = %m\n
; bos-format = %S\n
; eos-format = EOS\n
```

- You can try using IPAdic Neologd or other community based dictionary with the same method with the same method.
  - The important files are `char.bin`, `dicrc`, `matrix.bin`, `sys.dic`, `unk.dic`.
- Put it in a directory, and set the dicdir based on the dictionary directory.

### Brew Based Dictionary

- https://formulae.brew.sh/formula/mecab-unidic

- https://formulae.brew.sh/formula/mecab-jumandic#default

- https://formulae.brew.sh/formula/mecab-ipadic#default



Linux set up should be similar
