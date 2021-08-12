const fs = require('fs');
const Cache = require("file-system-cache").default
const { spawn } = require('child_process');
const axios = require('axios');
const clipboardListener = require('clipboard-event');
const clipboard = require('clipboardy');

//should probably use *os.tmpdir()* here
const STORAGE_DIR = './tmp';
const API_URL = 'http://127.0.0.1:5000/audio'
const PLAYER_EXECUTABLE = 'foobar2000.exe'

const cache = Cache({
  basePath: STORAGE_DIR, // Optional. Path where cache files are stored (default).
  ns: "audio" // Optional. A grouping namespace for items.
});

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
  const cachedPath = await cache.get(text)

  let audio
  if (!cachedPath) {
    try {
      audio = await axios.post(API_URL, { text: sanitizedText }, { responseType: 'arraybuffer' });
    } catch {
      console.log('Failed to attain audio from server');
    }
    
    if (audio) {
      const fileName = `${time}.wav`
      fs.writeFileSync(`${STORAGE_DIR}/${fileName}`, audio.data);
      await cache.set(text, fileName)
      spawn(PLAYER_EXECUTABLE, [`./${STORAGE_DIR}/${fileName}`]);
    }
  } else {
    spawn(PLAYER_EXECUTABLE, [`./${STORAGE_DIR}/${cachedPath}`]);
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