const fs = require('fs');
const { spawn } = require('child_process');

const axios = require('axios');
const clipboardListener = require('clipboard-event');
const clipboard = require('clipboardy');

//should probably use *os.tmpdir()* here
const STORAGE_DIR = './tmp';
const SERVER_URL = 'http://127.0.0.1:5000/audio'
const PLAYER = 'foobar2000.exe'

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR);
}

const getAudio = async text => {
  const time = Date.now()
  console.info(`[${time}]\n${text} \n`);

  console.time('Time elapsed')
  let audio
  try {
    audio = await axios.post(SERVER_URL, { text }, { responseType: 'arraybuffer' });
  } catch {
    console.log('Failed to attain audio from server');
  }
  console.timeEnd('Time elapsed')
  if (audio) {
    const returnedB64 = Buffer.from(audio.data).toString('base64');
    const fileName = `${time}_${text.slice(0, 10)}.wav`
    fs.writeFileSync(`${STORAGE_DIR}/${fileName}`, returnedB64, { encoding: 'base64' });
    spawn(PLAYER, [`./${STORAGE_DIR}/${fileName}`]);
  }
}

clipboardListener.startListening();
clipboardListener.on('change', () => {
  let text
  try {
    text = clipboard.readSync();
  } catch {
    console.warn(`Couldn't read clipboard`);
  }

  getAudio(text)
});

console.info('Listening for clipboard change');