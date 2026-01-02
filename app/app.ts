/**
 * NativeScript Application Entry Point
 *
 * CRITICAL RULES:
 * 1. NO side-effects at module scope (no function calls, no getInstance())
 * 2. Only import statements and function declarations at top-level
 * 3. Firebase and heavy modules must be imported LAZILY via await import()
 * 4. All initialization happens in launchEvent handler
 */

import { Application } from "@nativescript/core";

// Declare android for native logging
declare const android: any;

/**
 * Attach global error handlers - safe to call at module scope
 * because it only registers callbacks, doesn't execute business logic
 */
function attachGlobalHandlers(): void {
    console.log("STEP 1: Registering error handlers");

    Application.on(Application.uncaughtErrorEvent, (args: any) => {
        console.error("NS UNCAUGHT ERROR:", args?.error);
        if (args?.error?.stack) console.error(args.error.stack);
    });

    (globalThis as any).process?.on?.("unhandledRejection", (reason: any) => {
        console.error("UNHANDLED PROMISE:", reason);
        if (reason?.stack) console.error(reason.stack);
    });

    console.log("STEP 2: Error handlers registered");
}

/**
 * Initialize all services - called ONLY from launchEvent
 * Uses dynamic imports to avoid module-scope side effects
 */
async function initializeServices(): Promise<void> {
    console.log("STEP 3: Loading environment config");

    const { getEnvironmentService } = await import("./config/environment.config");
    const env = getEnvironmentService();

    // Firebase imports MUST be lazy (not top-level)
    // They trigger native initialization that can crash if done too early
    if (env.isFeatureEnabled("useFirebaseAuth")) {
        console.log("STEP 4: Loading Firebase modules lazily");
        await import("@nativescript/firebase-auth");
        await import("@nativescript/firebase-firestore");
        console.log("STEP 5: Firebase modules loaded");
    }

    console.log("STEP 6: Loading core services");
    const { getAuthService } = await import("./services/auth-factory.service");
    const { AdminService } = await import("./services/admin.service");
    const { PermissionsService } = await import("./services/permissions.service");
    const { NavigationService } = await import("./services/navigation.service");

    console.log("STEP 7: Initializing core services");
    getAuthService();
    AdminService.getInstance();
    PermissionsService.getInstance();
    NavigationService.getInstance();

    if (!env.isFeatureEnabled("useFirebaseAuth")) {
        console.log("STEP 8: Loading demo data services");
        const { DemoDataService } = await import("./services/demo/demo-data.service");
        const { DebugUtil } = await import("./utils/debug.util");

        console.log("STEP 9: Initializing demo data");
        DemoDataService.getInstance().initializeDemoData();
        DebugUtil.printRegisteredUsers();
    } else {
        console.log("STEP 8: Using Firebase Auth - demo data skipped");
    }

    console.log("STEP 10: All services initialized");
}

// ============================================================
// MODULE EXECUTION STARTS HERE
// Only: handler registration + Application.run()
// ============================================================

try {
    android.util.Log.i("NativeScript", "### APP.TS MODULE EXECUTING ###");
} catch (e) { /* iOS */ }

// Register error handlers (safe - just callback registration)
attachGlobalHandlers();

// Register launch event handler - this is where initialization happens
Application.on(Application.launchEvent, async () => {
    try {
        android.util.Log.i("NativeScript", "### LAUNCH EVENT FIRED ###");
    } catch (e) { /* iOS */ }

    console.log("### BOOTSTRAP START (launchEvent) ###");

    try {
        await initializeServices();
        console.log("### BOOTSTRAP COMPLETE ###");
    } catch (e) {
        console.error("BOOTSTRAP FAILED:", e);
        try {
            android.util.Log.e("NativeScript", "BOOTSTRAP FAILED: " + String(e));
        } catch (ex) { /* iOS */ }
        throw e;
    }
});

console.log("STEP 11: Calling Application.run()");

try {
    android.util.Log.i("NativeScript", "### BEFORE Application.run ###");
} catch (e) { /* iOS */ }

// Start the application
Application.run({ moduleName: "app-root" });
