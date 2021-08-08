const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const clipboardListener = require('clipboard-event');
const clipboard = require('clipboardy');

//should probably use *os.tmpdir()* here
const STORAGE_DIR = './tmp';
const API_URL = 'http://127.0.0.1:5000/audio'
const PLAYER_EXECUTABLE = 'foobar2000.exe'

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR);
}

const sanitizeText = text => {
  return text
    .replace('\x00', '')
}

const getAudio = async text => {
  const time = Date.now()
  const sanitizedText = sanitizeText(text)
  console.info(`[${time}]\n${sanitizedText}`);

  let audio
  try {
    audio = await axios.post(API_URL, { text: sanitizedText }, { responseType: 'arraybuffer' });
  } catch {
    console.log('Failed to attain audio from server');
  }
  if (audio) {
    const fileName = `${time}_${sanitizedText.slice(0, 15).trim()}.wav`
    fs.writeFileSync(`${STORAGE_DIR}/${fileName}`, audio.data);
    spawn(PLAYER_EXECUTABLE, [`./${STORAGE_DIR}/${fileName}`]);
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