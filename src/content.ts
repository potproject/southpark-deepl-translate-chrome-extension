// @ts-ignore
import { WebVTTParser } from 'webvtt-parser';

const testMode = false;

type storageType = {
  api_type?: "free" | "pro",
  deepl_auth?: string,
  deepl_target?: string
}

const endpoint = {
  free: "https://api-free.deepl.com/v2/translate",
  pro: "https://api.deepl.com/v2/translate "
}

let nowURL = "";
let nowText = "";

if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded',afterDOMLoaded);
} else {
  afterDOMLoaded();
}

function afterDOMLoaded(){
  getVideo();
}

function getVideo() {
  const video = document.querySelector("video");
  if (!video){
    setTimeout(() => {
      getVideo();
    }, 1000);
    return;
  }
  video.addEventListener("play", (e) => {
    setTrack(video);
  });
  video.addEventListener("loadedmetadata", (e) => {
    setTrack(video);
  });
}

function setTrack(video: HTMLVideoElement){
  const track = video.querySelector("track");
  if (track && track.src) {
    const blobURL = track.src;
    translate(blobURL).then(
      (url) => { if (url) { track.src = url } }
    )
  }
}

async function translate(blobUrl: string): Promise<string> {
  if (nowURL === blobUrl) {
    return "";
  }
  let text = await fetch(blobUrl).then(res => res.text());
  if (nowText === text) {
    return "";
  }
  nowText = text;
  const parser = new WebVTTParser();
  const tree = parser.parse(text);
  if (tree === null) {
    return "";
  }

  
  let storage = await chrome.storage.local.get(["api_type", "deepl_auth", "deepl_target"]) as storageType;

  if(!storage.api_type || !storage.deepl_auth || !storage.deepl_target){
    displayLog("Settings Not found. Please Deepl API Settings.");
    return "";
  }
  const textArray = tree.cues.map((vtt: any) => vtt.text) as string[];
  const textParsedArray = textArray.map((text) => text.replaceAll("<b>", "").replaceAll("</b>", "").replaceAll("\n", " ").replaceAll("♪", ""));
  const length = textParsedArray.reduce(
    (pv, cv) => pv + cv.length,
    0
  );
  displayLog("Translating... TextLength: " + length + " Target: " + storage.deepl_target + (testMode ? " TESTMODE" : ""));
  const deeplArrayChunk = chunk(textParsedArray as string[], 50) as string[][];
  const textTranslatedArray = [];
  if (testMode) {
    await sleep(5000);
    textTranslatedArray.push(...textParsedArray);
  } else {
    try {
      for (const deeplArr of deeplArrayChunk) {
        textTranslatedArray.push(...await deeplFetch(deeplArr,storage.api_type,storage.deepl_auth,storage.deepl_target));
      }
    } catch (e: any) {
      displayLog("Translation Failed. Error: " + e.message);
      throw e;
    }
  }
  displayLog("Translation is complete.");
  for (const index in textArray) {
    if (textTranslatedArray[index]) {
      text = text.replace(textArray[index], "<b>" + textTranslatedArray[index] + "</b>");
    }
  }
  let blob = new Blob([text], { type: 'text/vtt' });
  nowURL = URL.createObjectURL(blob);
  return nowURL;
}

async function deeplFetch(textArray: string[], api_type:"free"|"pro", auth_key: string, target_lang: string): Promise<string[]> {
  let formData = new FormData();
  formData.append('auth_key', auth_key);
  formData.append('source_lang', "EN");
  formData.append('target_lang', target_lang);
  for (const text of textArray) {
    formData.append('text', text);
  }
  const results = await fetch(endpoint[api_type], {
    method: 'post',
    body: formData,
  }).then(res => {
    if(res.status === 403){
      throw new Error("Authentication failure");
    }
    return res.json();
  });
  return (results.translations as { detected_source_language: string, text: string }[]).map(({ text }) => { return text; });
}

function chunk<T extends any[]>(arr: T, size: number) {
  return arr.reduce(
    (newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]),
    [] as T[][]
  )
}

const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

function displayLog(text: string) {
  console.log("[southpark-deepl-translate] " + text);
  const existDiv = document.getElementById("southpark-deepl-translate");
  if (existDiv) {
    existDiv.textContent = text;
    return;
  }
  const timer = document.querySelector('#media-container .edge-gui-timer');
  if (!timer) {
    return;
  }
  const div = document.createElement("div");
  div.id = "southpark-deepl-translate";
  div.textContent = text;
  timer.append(div);
}