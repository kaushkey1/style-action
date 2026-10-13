import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.impetus.commandcentre",
  appName: "Impetus Command Center",
  webDir: "dist",
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    scheme: "Impetus Command Center",
  },
  server: {
    hostname: "app.jioimpetus.com",
    iosScheme: "https",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
