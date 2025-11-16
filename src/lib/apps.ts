import appsData from "../../public/appfair-apps.json";
import altstoreData from "../../public/altstore.json";
//import fdroidData from "../../public/fdroid.json"; // TODO

export interface AppInfo {
    token: string;
    ios?: DarwinAppInfo;
    android?: AndroidAppInfo;
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

var altstoreApps: AltAppInfo[] = altstoreData.apps;

// merge the altstore app info into the app itself
var allApps: AppInfo[] = appsData.apps;

allApps.forEach((app: AppInfo) => {
    var iosApp = app.ios;
    if (iosApp === null) {
        return;
    }
    
    console.log(`searching for ${iosApp.bundleId} in ${altstoreApps.length} altstore apps…`);
    var altStoreApp: AltAppInfo = altstoreApps.find(a => a.bundleIdentifier == iosApp.bundleId);
    console.log(`found: ${altStoreApp}`);

    //app.ios.appInfo = null;
    if (altStoreApp) {
        iosApp.appInfo = altStoreApp;
        console.log(`assigned: ${altStoreApp}`);
        //app.ios.appInfo = altStoreApp;
        app.ios = iosApp;
        console.log(`matched: ${app.ios?.appInfo}`);
    }
});

// TODO: merge the F-Droid app info into the app

export const apps: AppInfo[] = allApps;
