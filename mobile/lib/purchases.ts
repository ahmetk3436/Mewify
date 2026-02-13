import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
let isInitialized = false;

export const initializePurchases = async (): Promise<boolean> => {
  if (isInitialized) return true;
  if (!API_KEY) return false;

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: API_KEY });
    isInitialized = true;
    return true;
  } catch {
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (!isInitialized) {
    const initialized = await initializePurchases();
    if (!initialized) return false;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active.premium !== undefined;
  } catch {
    return false;
  }
};
