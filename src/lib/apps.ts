import appsData from "../../public/appfair-apps.json";
import altstoreData from "../../public/altstore.json";
//import fdroidData from "../../public/fdroid.json"; // TODO

export interface AppInfo {
    token: string;
    ios?: DarwinAppInfo;
    android?: AndroidAppInfo;
    rank?: int;
}

export interface DarwinAppInfo {
    bundleId: string;
    appleItemId?: string;
    appInfo?: AltAppInfo;
}

export interface AndroidAppInfo {
    appid: string;
}

export interface AltAppInfo {
    name: string;
    subtitle?: string;
    localizedDescription?: string;
    bundleIdentifier: string;
    appPermissions?: AltAppPermissions;
    category?: string;
    developerName?: string;
    iconURL?: string;
    marketplaceID?: string;
    bundleIdentifier: string;
    screenshots: AltAppScreenshots;
    versions: [AltAppVersion];
}

export interface AltAppPermissions {
    entitlements?: [AltAppEntitlement];
    privacy?: [AltAppPrivacy];
}

export interface AltAppEntitlement {
    name: string;
}

export interface AltAppPrivacy {
    name: string;
    usageDescription: string;
}

export interface AltAppScreenshots {
    iphone?: [string];
}

export interface AltAppVersion {
    version: string;
    buildVersion: string;
    date: string;
    downloadURL: string;
    localizedDescription?: string;
    size: int;
}

const altstoreApps: AltAppInfo[] = altstoreData.apps;

// index the AltAppInfo array by the bundleIdentifier
const altstoreAppRecords: Record<string, AltAppInfo> = altstoreApps.reduce((acc, appInfo) => {
    acc[appInfo.bundleIdentifier] = appInfo;
    return acc;
  }, {} as Record<string, AltAppInfo>);

// merge the AltStore app info into the app itself
const allApps: AppInfo[] = appsData.apps;

allApps.forEach((appInfo, index) => {
    // assign the rank as the index if it is not already set in the list
    appInfo.rank = appInfo.rank ?? index;  
});

const allAppRecords: Record<string, AppInfo> = allApps.reduce((acc, appInfo) => {
    // update the appInfo with the AltAppInfo
    let iosInfo = appInfo.ios;
    if (iosInfo != null) {
        iosInfo.appInfo = altstoreAppRecords[iosInfo.bundleId];
        //console.log(`iosInfo.appInfo for ${iosInfo.bundleId}: ${iosInfo.appInfo}`);
        appInfo.ios = iosInfo;
    }
    //console.log(`appInfo.ios.appInfo: ${appInfo.ios.appInfo}`);

    // TODO: do the same with the fdroid index
    acc[appInfo.token] = appInfo;
    return acc;
  }, {} as Record<string, AppInfo>);

export const apps: Record<string, AppInfo> = allAppRecords;
