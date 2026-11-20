import appJson from "./app.json";
const expo = appJson.expo;
export default {
  ...expo,
  owner: "colvindiegoss-team",
  extra: {
    ...(expo.extra || {}),
    eas: { projectId: "20f42d9f-0388-4563-8601-f6c579bbbafb" },
  },
  logoUrl: "https://cenaapp-rgtrg8wt.manus.space/cena-logo.png",
};
