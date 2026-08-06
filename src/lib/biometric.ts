import { isNativePlatform } from "./platform";

export type BiometricAvailability =
  | { available: true; biometryType: string }
  | { available: false; reason: string };

/**
 * Check whether Face ID / Touch ID / device biometrics can be used.
 * Web builds report unavailable (lock is native-only for App Store path).
 */
export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  if (!isNativePlatform()) {
    return {
      available: false,
      reason: "Biometric lock is available in the iOS / Android app.",
    };
  }

  try {
    const { NativeBiometric } = await import(
      "@capgo/capacitor-native-biometric"
    );
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) {
      return {
        available: false,
        reason: "Biometrics are not set up on this device.",
      };
    }
    const type =
      result.biometryType === 1
        ? "Touch ID"
        : result.biometryType === 2
          ? "Face ID"
          : result.biometryType === 3
            ? "Fingerprint"
            : "Biometrics";
    return { available: true, biometryType: type };
  } catch {
    return {
      available: false,
      reason: "Biometric plugin is not available in this build.",
    };
  }
}

/** Prompt Face ID / Touch ID. Returns true when the user authenticates. */
export async function authenticateBiometric(
  reason = "Unlock WorthBook",
): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const { NativeBiometric } = await import(
      "@capgo/capacitor-native-biometric"
    );
    await NativeBiometric.verifyIdentity({
      reason,
      title: "WorthBook",
      subtitle: "Confirm it is you",
      description: reason,
      negativeButtonText: "Cancel",
      maxAttempts: 5,
    });
    return true;
  } catch {
    return false;
  }
}
