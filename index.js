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
  const trimmed_text = text.replace('\x00', '');
  console.info(`[${time}]\n${trimmed_text}`);

  let audio
  try {
    audio = await axios.post(SERVER_URL, { text: trimmed_text }, { responseType: 'arraybuffer' });
  } catch {
    console.log('Failed to attain audio from server');
  }
  if (audio) {
    const fileName = `${time}_${trimmed_text.slice(0, 10)}.wav`
    fs.writeFileSync(`${STORAGE_DIR}/${fileName}`, audio.data);
    spawn(PLAYER, [`./${STORAGE_DIR}/${fileName}`]);
  }
}

clipboardListener.startListening();
clipboardListener.on('change', async () => {
  let text
  try {
    text = clipboard.readSync();
  } catch {
    console.warn(`Couldn't read clipboard`);
  }

  if (text) {
    console.time('Time elapsed')
    await getAudio(text)
    console.timeEnd('Time elapsed')
  }
});

console.info('Listening for clipboard changes');