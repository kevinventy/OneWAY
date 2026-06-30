import { useCallback } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Affiche une confirmation « Quitter ONE WAY ? » lorsque l'utilisateur appuie
 * sur le bouton retour (Android) depuis un écran racine — évite de fermer
 * l'app par erreur. À n'utiliser que sur les écrans d'où « retour » fermerait
 * l'application (accueil, page de bienvenue).
 */
export function useExitConfirm() {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const onBack = () => {
        Alert.alert(
          'Quitter ONE WAY ?',
          'Voulez-vous fermer l’application ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Quitter', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true },
        );
        return true; // empêche la fermeture immédiate par le système
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, []),
  );
}
