# Shunou

Shunou uses the MeCab tokenizer, which is a binding for the CLI of MeCab. It should be available for EVERY OS!

This repo is heavily referenced by:
- https://github.com/MikimotoH/furigana
- https://github.com/hockyy/nican

## MacOS Setup

- Install `mecab` via brew

- Install `pyenv` via brew
- Install the python 3.9 through pyenv, the developer uses 3.9.16 in MacOS M1 running Ventura

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
