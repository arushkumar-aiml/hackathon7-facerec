import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Vibration, Platform, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getEnrolled, logAttendance } from '../services/DatabaseService';
import { extractFeatures, matchFace } from '../services/FaceMatcher';
import { LivenessDetector } from '../services/LivenessDetector';

const STATUS = {
  INIT: 'INIT',
  NO_FACE: 'NO_FACE',
  LIVENESS: 'LIVENESS',
  MATCHING: 'MATCHING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

export default function AttendanceScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState(STATUS.INIT);
  const [challenge, setChallenge] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [faceBox, setFaceBox] = useState(null);

  const livenessRef = useRef(new LivenessDetector());
  const enrolledRef = useRef([]);
  const processingRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
      enrolledRef.current = await getEnrolled();
      startSession();
    })();
  }, []);

  useEffect(() => {
    if (status === STATUS.LIVENESS) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [status]);

  const startSession = useCallback(() => {
    livenessRef.current.reset();
    livenessRef.current.start();
    setStatus(STATUS.NO_FACE);
    setResult(null);
    setProgress(0);
    setChallenge(livenessRef.current.label);
    processingRef.current = false;
  }, []);

  const handleFacesDetected = useCallback(async ({ faces }) => {
    if (processingRef.current) return;
    if (status === STATUS.SUCCESS || status === STATUS.FAILED) return;

    if (!faces || faces.length === 0) {
      setFaceBox(null);
      if (status !== STATUS.NO_FACE) setStatus(STATUS.NO_FACE);
      return;
    }

    const face = faces[0];
    setFaceBox(face.bounds);

    // Start liveness if not already
    if (status === STATUS.NO_FACE || status === STATUS.INIT) {
      setStatus(STATUS.LIVENESS);
    }

    if (status === STATUS.LIVENESS) {
      const lv = livenessRef.current;
      const res = lv.processFrame(face);
      setProgress(lv.progress);
      setChallenge(lv.label);

      if (res === 'TIMEOUT') {
        setStatus(STATUS.FAILED);
        setResult({ msg: 'Liveness timeout. Try again.' });
        setTimeout(startSession, 2500);
        return;
      }

      if (res === 'COMPLETE' || lv.done) {
        processingRef.current = true;
        setStatus(STATUS.MATCHING);
        await doRecognition(face);
      }
    }
  }, [status]);

  const doRecognition = async (face) => {
    try {
      if (enrolledRef.current.length === 0) {
        setStatus(STATUS.FAILED);
        setResult({ msg: 'No users enrolled yet!\nGo to Dashboard → Enroll Personnel first.' });
        setTimeout(startSession, 3000);
        return;
      }

      const features = extractFeatures(face);
      const { matched, user, confidence } = matchFace(features, enrolledRef.current);

      if (matched) {
        await logAttendance({
          userId: user.user_id,
          name: user.name,
          confidence,
          liveness: true,
        });
        Vibration.vibrate(200);
        setStatus(STATUS.SUCCESS);
        setResult({ user, confidence });
        setTimeout(startSession, 3500);
      } else {
        Vibration.vibrate([0, 80, 80, 80]);
        setStatus(STATUS.FAILED);
        setResult({ msg: `No match found (${confidence}% confidence)` });
        setTimeout(startSession, 2500);
      }
    } catch (e) {
      setStatus(STATUS.FAILED);
      setResult({ msg: 'Error during recognition.' });
      setTimeout(startSession, 2000);
    } finally {
      processingRef.current = false;
    }
  };

  if (!permission) return <View style={styles.center}><Text style={styles.white}>Checking camera...</Text></View>;
  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={styles.white}>Camera permission needed</Text>
      <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
        <Text style={styles.white}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  const statusColor = {
    [STATUS.NO_FACE]: '#90A4AE',
    [STATUS.LIVENESS]: '#29B6F6',
    [STATUS.MATCHING]: '#CE93D8',
    [STATUS.SUCCESS]: '#66BB6A',
    [STATUS.FAILED]: '#EF5350',
    [STATUS.INIT]: '#90A4AE',
  }[status];

  const statusMsg = {
    [STATUS.INIT]: 'Initializing...',
    [STATUS.NO_FACE]: 'Position your face in the oval',
    [STATUS.LIVENESS]: 'Liveness check',
    [STATUS.MATCHING]: 'Recognizing face...',
    [STATUS.SUCCESS]: '✅ Attendance Marked!',
    [STATUS.FAILED]: '❌ Verification Failed',
  }[status];

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      />

      {/* Dark overlay top */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.topTitle}>Datalake 3.0</Text>
        <Text style={styles.topSub}>Field Attendance</Text>
      </View>

      {/* Face oval guide */}
      <View style={styles.ovalWrapper} pointerEvents="none">
        <Animated.View
          style={[
            styles.oval,
            { borderColor: statusColor, transform: [{ scale: pulseAnim }] }
          ]}
        />
      </View>

      {/* Bottom status card */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={styles.statusMsg}>{statusMsg}</Text>

        {status === STATUS.LIVENESS && (
          <>
            <Text style={styles.challengeText}>{challenge}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: statusColor }]} />
            </View>
          </>
        )}

        {status === STATUS.SUCCESS && result?.user && (
          <View style={styles.resultBox}>
            <Text style={styles.resultName}>{result.user.name}</Text>
            <Text style={styles.resultDept}>{result.user.department}</Text>
            <Text style={styles.resultConf}>{result.confidence}% confidence · {new Date().toLocaleTimeString()}</Text>
          </View>
        )}

        {status === STATUS.FAILED && result?.msg && (
          <Text style={styles.failMsg}>{result.msg}</Text>
        )}

        {(status === STATUS.FAILED || status === STATUS.NO_FACE) && (
          <TouchableOpacity style={styles.retryBtn} onPress={startSession}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#0A0F1E', justifyContent: 'center', alignItems: 'center' },
  white: { color: '#fff', fontSize: 15 },
  permBtn: { marginTop: 16, backgroundColor: '#1565C0', padding: 14, borderRadius: 10 },

  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingBottom: 12,
  },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  topSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },

  ovalWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  oval: {
    width: 220, height: 280, borderRadius: 110,
    borderWidth: 3, borderColor: '#90A4AE',
  },

  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, alignItems: 'center',
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
  statusMsg: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  challengeText: { color: '#29B6F6', fontSize: 18, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  progressBar: {
    width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3, marginTop: 12, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  resultBox: { marginTop: 10, alignItems: 'center' },
  resultName: { color: '#66BB6A', fontSize: 22, fontWeight: '800' },
  resultDept: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },
  resultConf: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 },

  failMsg: { color: '#EF5350', fontSize: 13, marginTop: 8, textAlign: 'center' },

  retryBtn: {
    marginTop: 14, backgroundColor: '#1565C0',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32,
  },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backBtn: { marginTop: 12 },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
});
