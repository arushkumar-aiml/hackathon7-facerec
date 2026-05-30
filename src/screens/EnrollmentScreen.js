import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { enrollUser } from '../services/DatabaseService';
import { extractFeatures, averageFeatures } from '../services/FaceMatcher';

const POSES = [
  '😐 Look straight at camera',
  '↙️ Tilt head slightly left',
  '↘️ Tilt head slightly right',
  '😊 Now smile',
  '😐 Look straight again',
];

export default function EnrollmentScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFace, setLastFace] = useState(null);

  const canCapture = userId.trim() && name.trim() && lastFace && samples.length < POSES.length;
  const canEnroll = samples.length === POSES.length && userId.trim() && name.trim();

  const capture = async () => {
    if (!lastFace || loading) return;
    setLoading(true);
    try {
      const features = extractFeatures(lastFace);
      setSamples(prev => [...prev, features]);
    } catch {
      Alert.alert('Error', 'Could not capture face. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const enroll = async () => {
    if (!canEnroll) return;
    setLoading(true);
    try {
      const avgEmbedding = averageFeatures(samples);
      await enrollUser({
        userId: userId.trim(),
        name: name.trim(),
        department: dept.trim(),
        embedding: avgEmbedding,
      });
      Alert.alert('✅ Enrolled!',
        `${name} enrolled successfully with ${samples.length} face samples.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!permission?.granted) return (
    <View style={styles.center}>
      <Text style={styles.permText}>Camera permission needed</Text>
      <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Enroll New Personnel</Text>

      {/* Input Fields */}
      <View style={styles.card}>
        {[
          { label: 'Employee ID *', val: userId, set: setUserId, ph: 'e.g. EMP001', caps: 'characters' },
          { label: 'Full Name *', val: name, set: setName, ph: 'e.g. Rajesh Kumar', caps: 'words' },
          { label: 'Department', val: dept, set: setDept, ph: 'e.g. Field Operations', caps: 'words' },
        ].map(f => (
          <View key={f.label}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput style={styles.input} value={f.val} onChangeText={f.set}
              placeholder={f.ph} placeholderTextColor="#aaa" autoCapitalize={f.caps} />
          </View>
        ))}
      </View>

      {/* Camera */}
      <View style={styles.camBox}>
        <CameraView
          style={{ flex: 1 }}
          facing="front"
          onFacesDetected={({ faces }) => {
            if (faces?.length > 0) setLastFace(faces[0]);
            else setLastFace(null);
          }}
          faceDetectorSettings={{
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
            minDetectionInterval: 200,
            tracking: false,
          }}
        />
        {/* Pose guide */}
        {samples.length < POSES.length && (
          <View style={styles.poseOverlay}>
            <Text style={styles.poseTxt}>{POSES[samples.length]}</Text>
          </View>
        )}
        {/* Face indicator */}
        <View style={[styles.faceIndicator, { backgroundColor: lastFace ? '#43A04755' : '#EF535055' }]}>
          <Text style={{ color: '#fff', fontSize: 11 }}>
            {lastFace ? '✅ Face detected' : '❌ No face'}
          </Text>
        </View>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {POSES.map((_, i) => (
          <View key={i} style={[styles.dot,
            i < samples.length ? styles.dotFilled : styles.dotEmpty,
          ]} />
        ))}
      </View>
      <Text style={styles.sampleCount}>{samples.length}/{POSES.length} samples</Text>

      {/* Buttons */}
      {!canEnroll ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#1565C0' }, (!canCapture) && styles.btnDim]}
          onPress={capture} disabled={!canCapture || loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnTxt}>📸 Capture Sample {samples.length + 1}</Text>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#2E7D32' }]}
          onPress={enroll} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnTxt}>✅ Enroll User</Text>}
        </TouchableOpacity>
      )}

      {samples.length > 0 && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#455A64' }]}
          onPress={() => setSamples([])}>
          <Text style={styles.btnTxt}>🔄 Reset Samples</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' },
  permText: { fontSize: 15, color: '#333', marginBottom: 12 },
  permBtn: { backgroundColor: '#1565C0', padding: 14, borderRadius: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A237E', margin: 16, marginTop: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, margin: 14, padding: 16, elevation: 2 },
  label: { fontSize: 12, color: '#666', marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#C5CAE9', borderRadius: 8,
    padding: 10, fontSize: 15, color: '#1A237E', backgroundColor: '#FAFBFF',
  },
  camBox: { height: 260, marginHorizontal: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  poseOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)', padding: 10, alignItems: 'center',
  },
  poseTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  faceIndicator: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotEmpty: { backgroundColor: '#C5CAE9' },
  dotFilled: { backgroundColor: '#2E7D32' },
  sampleCount: { textAlign: 'center', color: '#666', fontSize: 12, marginTop: 4, marginBottom: 8 },
  btn: { marginHorizontal: 14, marginTop: 10, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDim: { opacity: 0.45 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
