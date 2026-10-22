# About page narration

`packages/hb/src/content/about/narration.m4a` is the About page read aloud. It was made from `narration.txt` with [Kokoro](https://github.com/hexgrad/kokoro) through `kokoro-js`, voice `af_heart`, 8-bit weights (`q8`) on the CPU.

`narration.txt` is the article text written for the ear:

- It reads the title, lead, source, body and the Fig. 1 caption. Links, reference marks and the back matter are left out.
- Words the voice misreads are respelled: "pre-processed", "A-P-I", "ExPecto S-C", "P-TEN", "D-N-ase", "Net-WAS", "G O" and "M Sig D B".

The article text on the page is the transcript, so change the page and this script together.

## Regenerating

`kokoro-js` is not a dependency of this repository. Install it in a folder outside the workspace and run a copy of the script there, so Node finds the package:

```sh
mkdir -p ~/narration && cd ~/narration
npm i kokoro-js
cp /path/to/Humanbase-frontend/scripts/narration/speak.mjs .
node speak.mjs /path/to/Humanbase-frontend/scripts/narration/narration.txt about.wav af_heart
```

The first run downloads the model, about 90 MB, and the whole article takes several minutes on a laptop. Convert the WAV to AAC before committing, for example on macOS:

```sh
afconvert -f m4af -d aac -b 64000 about.wav /path/to/Humanbase-frontend/packages/hb/src/content/about/narration.m4a
```

or with ffmpeg: `ffmpeg -i about.wav -c:a aac -b:a 64k narration.m4a`. Then set `duration` in `packages/hb/src/content/about/about.tsx` to the new length in whole seconds. Don't commit the WAV.
