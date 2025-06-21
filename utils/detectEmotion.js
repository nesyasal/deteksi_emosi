import emotionKeywords from "../emotion/keywords.js";

// Fungsi normalisasi teks: huruf kecil + hapus tanda baca
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectEmotion(rawText) {
  const text = normalize(rawText);
  const tokens = text.split(" "); // tokenisasi per kata
  const scores = {};

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    scores[emotion] = 0;
    for (const keyword of keywords) {
      if (tokens.includes(keyword)) {
        scores[emotion] += 1;
      } else if (text.includes(keyword)) {
        // tangani frasa pendek juga
        scores[emotion] += 1;
      }
    }
  }

  let maxEmotion = "suasana_netral";
  let maxScore = 0;

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }

  return maxScore > 0 ? maxEmotion : "suasana_netral";
}

export default detectEmotion;
