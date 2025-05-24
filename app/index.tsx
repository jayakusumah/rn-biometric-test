import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Text, View } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import axios from '../api/axios';

const rnBiometrics = new ReactNativeBiometrics();

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; username: string, nama: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [binding, setBinding] = useState(false);
  const [privateKeyStored, setPrivateKeyStored] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/me');
        setUser(res.data);
      } catch (error) {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const generateKeys = async () => {
    try {
      const { publicKey } = await rnBiometrics.createKeys();
      console.log('Public Key:', publicKey);
      
      return publicKey;
    } catch (e) {
      console.log('Error generating keys:', e);
    }
  };


  const handleBindBiometric = async () => {
    setBinding(true);

    try {
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        Alert.alert('Error', 'Biometric authentication is not available on this device.');
        return;
      }

      const publicKey = await generateKeys()

      // 🔥 Panggil backend untuk generate keypair
      const res = await axios.post('/api/generate-keypair', { publicKey });
      console.log(res.data)

      if (user?.id) {
        await SecureStore.setItemAsync('userId', user.id.toString());
      }
      setPrivateKeyStored(true);

      Alert.alert('Success', 'public key berhasil dikirim!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Terjadi kesalahan saat binding biometric.');
    } finally {
      setBinding(false);
    }
  };

  const isBind = async () => {
    const stored = await SecureStore.getItemAsync('userId');
    if (stored) {
      Alert.alert('userId ditemukan', 'Akun telah terbinding.');
    } else {
      Alert.alert('Tidak Ditemukan', 'Akun belum terbinding.');
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('token'); // hapus JWT token dari SecureStore
      router.replace('/login'); // redirect ke login screen
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal logout.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Hallo, {user?.nama}!</Text>

      <Button
        title={binding ? 'Binding Biometric...' : 'Binding Biometric'}
        onPress={handleBindBiometric}
        disabled={binding}
      />
      <View style={{ marginTop: 20 }}>
        <Button
          title="Logout"
          onPress={handleLogout}
          color="red"
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Cek Binding" onPress={isBind} />
        {privateKeyStored && (
          <Text style={{ marginTop: 10, color: 'green' }}>✔ Private key tersimpan!</Text>
        )}
      </View>
    </View>
  );
}
