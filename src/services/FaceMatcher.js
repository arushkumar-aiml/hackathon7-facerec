/**
 * FaceMatcher.js
 * Lightweight face matching using expo-face-detector landmark geometry.
 * No TensorFlow needed — works fully offline on any Expo-supported device.
 *
 * Strategy: Extract a 12-point geometric feature vector from face landmarks,
 * compare enrolled vs live using normalized Euclidean distance.
 */

// Extract normalized feature vector from face detector landmarks
export function extractFeatures(face) {
  const { bounds, landmarks } = face;
  const w = bounds.size.width;
  const h = bounds.size.height;

  // Normalize all coordinates relative to face bounding box
  const norm = (pt) => ({
    x: (pt.x - bounds.origin.x) / (w + 1e-6),
    y: (pt.y - bounds.origin.y) / (h + 1e-6),
  });

  const lm = {
    leftEye:    norm(landmarks.leftEye),
    rightEye:   norm(landmarks.rightEye),
    leftEar:    norm(landmarks.leftEar),
    rightEar:   norm(landmarks.rightEar),
    leftCheek:  norm(landmarks.leftCheek),
    rightCheek: norm(landmarks.rightCheek),
    mouthLeft:  norm(landmarks.mouthLeft),
    mouthRight: norm(landmarks.mouthRight),
    noseTip:    norm(landmarks.noseBase),
    bottomMouth:norm(landmarks.bottomMouth),
  };

  // Build feature vector: inter-landmark distances
  const dist = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

  return [
    dist(lm.leftEye, lm.rightEye),       // eye span
    dist(lm.leftEar, lm.rightEar),       // ear span
    dist(lm.leftCheek, lm.rightCheek),   // cheek width
    dist(lm.mouthLeft, lm.mouthRight),   // mouth width
    dist(lm.noseTip, lm.leftEye),        // nose-left eye
    dist(lm.noseTip, lm.rightEye),       // nose-right eye
    dist(lm.noseTip, lm.bottomMouth),    // nose-chin
    dist(lm.leftEye, lm.leftCheek),      // eye-cheek left
    dist(lm.rightEye, lm.rightCheek),    // eye-cheek right
    dist(lm.leftEye, lm.mouthLeft),      // eye-mouth left
    dist(lm.rightEye, lm.mouthRight),    // eye-mouth right
    dist(lm.mouthLeft, lm.bottomMouth),  // mouth height
  ];
}

// Average multiple feature vectors (for enrollment)
export function averageFeatures(featuresList) {
  const len = featuresList[0].length;
  const avg = new Array(len).fill(0);
  for (const f of featuresList) {
    for (let i = 0; i < len; i++) avg[i] += f[i];
  }
  return avg.map(v => v / featuresList.length);
}

// Cosine similarity between two feature vectors
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-6);
}

const THRESHOLD = 0.92; // cosine similarity threshold

export function matchFace(liveFeatures, enrolledUsers) {
  let bestMatch = null;
  let bestScore = -1;

  for (const user of enrolledUsers) {
    const score = cosineSimilarity(liveFeatures, user.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = user;
    }
  }

  const confidence = Math.round(bestScore * 100);
  return {
    matched: bestScore >= THRESHOLD,
    user: bestScore >= THRESHOLD ? bestMatch : null,
    confidence,
  };
}
