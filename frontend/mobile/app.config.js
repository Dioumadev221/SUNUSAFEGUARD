// Configuration dynamique par-dessus app.json.
// Une API en HTTP simple (test sur le Wi-Fi local) n'est autorisée par Android que si on le déclare.
// Dès que l'API est en ligne en HTTPS, ce réglage n'est plus appliqué.
module.exports = ({ config }) => {
  const api = process.env.EXPO_PUBLIC_API_URL ?? "";
  if (!api.startsWith("http://")) return config;
  return {
    ...config,
    plugins: [...(config.plugins ?? []), ["expo-build-properties", { android: { usesCleartextTraffic: true } }]],
  };
};
