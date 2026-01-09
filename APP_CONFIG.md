# App Configuration - Single Source of Truth

## Package ID
**`com.promoshake.nowastemed`**

This ID MUST be consistent across:
- `nativescript.config.ts` (id field)
- `package.json` (nativescript.id field)
- `App_Resources/Android/google-services.json` (package_name)
- Firebase Console

## Firebase Project
- Project ID: `nowastemed`
- Project Number: `521520656737`

## Build Commands
```bash
# Always use these scripts:
npm run android:prebuild   # Copies google-services.json
ns run android             # Build and run
```

## If Platform Rebuild Needed
```bash
# 1. Stop any running ns process first
# 2. Then:
Remove-Item -Recurse -Force .\platforms
ns platform add android
npm run android:prebuild
ns run android
```

## DO NOT CHANGE
- The package ID is tied to Firebase configuration
- Changing it requires updating Firebase Console and downloading new config files
