/**
 * LivenessDetector.js
 * Uses expo-face-detector's built-in classifiers:
 *   - leftEyeOpenProbability / rightEyeOpenProbability → BLINK
 *   - smilingProbability → SMILE
 *   - yawAngle → HEAD TURN
 *   - rollAngle → NOD
 */

const CHALLENGES = ['BLINK', 'SMILE', 'TURN'];

export class LivenessDetector {
  constructor() { this.reset(); }

  reset() {
    this.challenges = [];
    this.index = 0;
    this.done = false;
    this.failed = false;
    this.startTime = null;
    this._prevEAR = 1;
    this._blinkSeen = false;
  }

  start() {
    // Pick 2 random challenges
    const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5);
    this.challenges = shuffled.slice(0, 2);
    this.index = 0;
    this.done = false;
    this.failed = false;
    this.startTime = Date.now();
    return this.challenges;
  }

  get current() { return this.challenges[this.index]; }

  get label() {
    const map = {
      BLINK: '👁️  Blink your eyes',
      SMILE: '😊  Smile please',
      TURN:  '↔️  Turn head slightly left or right',
    };
    return map[this.current] || '';
  }

  get progress() {
    return Math.round((this.index / this.challenges.length) * 100);
  }

  processFrame(faceData) {
    if (this.done || this.failed || !this.current) return 'IDLE';

    // 15 sec timeout
    if (Date.now() - this.startTime > 15000) {
      this.failed = true;
      return 'TIMEOUT';
    }

    let met = false;

    switch (this.current) {
      case 'BLINK': {
        const ear = (faceData.leftEyeOpenProbability + faceData.rightEyeOpenProbability) / 2;
        if (this._prevEAR > 0.6 && ear < 0.3) met = true; // eye closed transition
        this._prevEAR = ear;
        break;
      }
      case 'SMILE':
        met = faceData.smilingProbability > 0.75;
        break;
      case 'TURN':
        met = Math.abs(faceData.yawAngle) > 15;
        break;
    }

    if (met) {
      this.index++;
      this._prevEAR = 1;
      if (this.index >= this.challenges.length) {
        this.done = true;
        return 'COMPLETE';
      }
      // reset timer for next challenge
      this.startTime = Date.now();
      return 'NEXT';
    }

    return 'IN_PROGRESS';
  }
}
