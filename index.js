const fs = require('fs');
const { spawn } = require('child_process');

const axios = require('axios');
const googleTTS = require('google-tts-api');
const clipboardListener = require('clipboard-event');
const clipboard = require('clipboardy');

const SERVER_URL = 'http://127.0.0.1:5000/audio'
//should probably use *os.tmpdir()* here
const STORAGE_DIR = './tmp';

const PLAYER = 'foobar2000.exe'


const getAudio = async text => {
  const time = Date.now()
  console.info(`[${time}]\n${text} \n`);

  console.time()
  const audio = await axios.post(SERVER_URL, { text }, { responseType: 'arraybuffer' });
  console.timeEnd()
  
  const returnedB64 = Buffer.from(audio.data).toString('base64');
  const fileName = `${time}_${text.slice(0, 10)}.wav`
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