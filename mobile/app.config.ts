import appJson from "./app.base.json";
const expo = appJson.expo as typeof appJson.expo & { extra?: Record<string, unknown> };
export default {
  ...expo,
  slug: "cena",
  owner: "colvindiegoss-team",
  plugins: [
    ...(expo.plugins || []),
    "expo-asset",
    "expo-font",
    "expo-secure-store",
    "expo-status-bar",
    "expo-web-browser",
  ],
  extra: {
    ...(expo.extra || {}),
    eas: { projectId: "20f42d9f-0388-4563-8601-f6c579bbbafb" },
  },
};
