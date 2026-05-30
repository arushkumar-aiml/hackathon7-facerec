import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStats, getAttendance, deleteEnrolled, getEnrolled } from '../services/DatabaseService';
import * as Network from 'expo-network';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ total: 0, unsynced: 0, users: 0 });
  const [logs, setLogs] = useState([]);
  const [online, setOnline] = useState(false);

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const loadData = async () => {
    const s = await getStats();
    const l = await getAttendance();
    const n = await Network.getNetworkStateAsync();
    setStats(s);
    setLogs(l);
    setOnline(n.isInternetReachable);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Datalake 3.0</Text>
        <Text style={styles.appSub}>Offline Face Recognition</Text>
        <View style={[styles.pill, online ? styles.pillGreen : styles.pillRed]}>
          <Text style={styles.pillText}>{online ? '🟢 Online' : '🔴 Offline Mode'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Enrolled', value: stats.users, color: '#1565C0' },
          { label: 'Total Logs', value: stats.total, color: '#2E7D32' },
          { label: 'Pending Sync', value: stats.unsynced, color: '#E65100' },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#1565C0' }]}
        onPress={() => navigation.navigate('Attendance')}>
        <Text style={styles.btnText}>📷  Mark Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#2E7D32' }]}
        onPress={() => navigation.navigate('Enrollment')}>
        <Text style={styles.btnText}>➕  Enroll New Personnel</Text>
      </TouchableOpacity>

      {stats.users > 0 && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#37474F' }]}
          onPress={async () => {
            const enrolled = await getEnrolled();
            Alert.alert('Enrolled Users', enrolled.map(u => `${u.name} (${u.user_id})`).join('\n') || 'None');
          }}>
          <Text style={styles.btnText}>👥  View Enrolled Users</Text>
        </TouchableOpacity>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          {logs.slice(0, 8).map(log => (
            <View key={log.id} style={styles.logCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logName}>{log.name}</Text>
                <Text style={styles.logId}>{log.user_id}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.logConf}>{log.confidence}% match</Text>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={[styles.logLive, { color: log.liveness ? '#66BB6A' : '#EF5350' }]}>
                  {log.liveness ? '✅ Live' : '⚠️ No liveness'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  header: { backgroundColor: '#0D47A1', padding: 30, alignItems: 'center', paddingTop: 50 },
  appName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  appSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  pill: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20 },
  pillGreen: { backgroundColor: 'rgba(0,200,83,0.25)' },
  pillRed: { backgroundColor: 'rgba(255,82,82,0.25)' },
  pillText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', padding: 14, gap: 10, marginTop: 4 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderTopWidth: 4, alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
  },
  statNum: { fontSize: 30, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },
  btn: { marginHorizontal: 14, marginTop: 10, borderRadius: 14, padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { margin: 14, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A237E', marginBottom: 10 },
  logCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
  },
  logName: { fontSize: 14, fontWeight: '700', color: '#1A237E' },
  logId: { fontSize: 11, color: '#999', marginTop: 2 },
  logConf: { fontSize: 12, fontWeight: '700', color: '#1565C0' },
  logTime: { fontSize: 11, color: '#999', marginTop: 2 },
  logLive: { fontSize: 11, marginTop: 2, fontWeight: '600' },
});
