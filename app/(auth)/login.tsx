import { Link, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axios from '../../api/axios';

import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export default function LoginScreen() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const { available } = await rnBiometrics.isSensorAvailable();
    const userId = await SecureStore.getItemAsync('userId');
    setBiometricAvailable(available && Boolean(userId));
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post('/api/login', {
        username,
        password,
      });
      await SecureStore.setItemAsync('token', res.data.token);
      await SecureStore.setItemAsync('userId', res.data.userId.toString());
      console.log(res.data.userId.toString())
      router.replace('/');
    } catch (err) {
      Alert.alert('Login gagal', 'Username atau password salah');
      console.error('Login failed:', err);
    }
  };

  // Buat challenge-response signature
  const signChallenge = async (challenge: string) => {
    try {
      const result = await rnBiometrics.createSignature({
        promptMessage: 'Sign in with Biometrics',
        payload: challenge,
      });

      if (result.success) {
        return result.signature;
      } else {
        Alert.alert('Failed', 'User cancelled or failed biometrics');
      }
    } catch (e) {
      console.log('Error signing challenge:', e);
    }
  };

  const loginBiometric = async () => {
    const userId = await SecureStore.getItemAsync('userId');

    if (!userId) {
      Alert.alert('Error', 'Biometrix belum terbinding!');
      return;

    }

    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${userId}:${timestamp}`;
    const signature = await signChallenge(data);

    const res = await axios.post('/api/biometric-login', {
      userId,
      timestamp,
      signature,
    });

    await SecureStore.setItemAsync('token', res.data.token);
    router.replace('/');
  }

  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      {biometricAvailable && (
        <View style={{ marginTop: 12 }}>
          <Button title="Login dengan Biometrik" onPress={loginBiometric} />
        </View>
      )}
      <Link href="/(auth)/register" asChild>
        <TouchableOpacity>
          <Text style={{ color: 'black', textAlign: 'center', marginTop: 16, fontWeight: 'bold' }}>
            Belum punya akun? Daftar di sini
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 5 },
});
