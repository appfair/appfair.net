#!/bin/sh
# Package and sign the F-Droid repo index entry: repo/entry.json -> repo/entry.jar
#
# F-Droid clients verify the repo by downloading entry.jar (a zip containing
# exactly entry.json, carrying a v1 JAR signature with SHA-256 digests and a
# SHA256withRSA signature — the same thing `fdroid signindex` produces via
# apksigner) and pinning the signing certificate's SHA-256 fingerprint.
#
# Usage:
#   FDROID_KEYSTORE=path/to/keystore.p12 \
#   FDROID_KEYSTORE_PASS=... \
#   [FDROID_KEY_ALIAS=appfair] \
#   scripts/fdroid-sign.sh site/public/repo
#
# Generate the (PKCS12) keystore once, mirroring fdroidserver's genkeystore
# (RSA 4096, SHA256withRSA, ~27 years):
#   keytool -genkeypair -keystore keystore.p12 -alias appfair \
#     -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10000 \
#     -storetype pkcs12 -storepass "$FDROID_KEYSTORE_PASS" \
#     -dname "CN=appfair.net, OU=F-Droid"
set -eu

REPO_DIR=${1:?usage: fdroid-sign.sh <repo dir containing entry.json>}
: "${FDROID_KEYSTORE:?FDROID_KEYSTORE not set}"
: "${FDROID_KEYSTORE_PASS:?FDROID_KEYSTORE_PASS not set}"
ALIAS=${FDROID_KEY_ALIAS:-appfair}

cd "$REPO_DIR"
[ -f entry.json ] || { echo "no entry.json in $REPO_DIR" >&2; exit 1; }

rm -f entry.jar
# -X: no platform extra fields; the signature only covers entry contents anyway
zip -X -q entry.jar entry.json

jarsigner -keystore "$FDROID_KEYSTORE" -storepass:env FDROID_KEYSTORE_PASS \
  -digestalg SHA-256 -sigalg SHA256withRSA entry.jar "$ALIAS"

# sanity: verify what we just produced, and print the fingerprint clients
# must pin (the add-repo URL is https://appfair.net/repo?fingerprint=<FP>)
jarsigner -verify entry.jar | grep -q "jar verified" || {
  echo "entry.jar failed verification" >&2; exit 1
}
FP=$(keytool -printcert -jarfile entry.jar | sed -n 's/.*SHA256: //p' \
  | head -n1 | tr -d ':' | tr '[:upper:]' '[:lower:]')
echo "[fdroid-sign] signed $REPO_DIR/entry.jar (repo fingerprint: $FP)"
