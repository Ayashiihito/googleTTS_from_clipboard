const fs = require('fs');
const axios = require('axios');
const { spawn } = require('child_process');

const googleTTS = require('google-tts-api');
const clipboardListener = require('clipboard-event');
const clipboard = require('clipboardy');

//should probably use *os.tmpdir()* here
const STORAGE_DIR = './tmp';

const PLAYER = 'foobar2000.exe'


const getAudio = async (text) => {

  const url = googleTTS.getAudioUrl(text, { lang: 'ja-JP' });
  const audio = await axios.get(url, { responseType: 'arraybuffer' });
  const returnedB64 = Buffer.from(audio.data).toString('base64');

  const time = Date.now()
  const fileName = `${time}.mp3`

  fs.writeFileSync(`${STORAGE_DIR}/${fileName}`, returnedB64, { encoding: 'base64' });
  spawn(PLAYER, [`./${STORAGE_DIR}/${fileName}`]);
}

clipboardListener.startListening();

clipboardListener.on('change', () => {

  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR);
  }

  const text = clipboard.readSync();
  getAudio(text)
});