package com.pharmapay.delivery.capture

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class CaptureNativeModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val REQUEST_CODE = 9001
    }

    override fun getName(): String = "CaptureNativeModule"

    @ReactMethod
    fun isNotificationAccessEnabled(promise: Promise) {
        try {
            val flat = Settings.Secure.getString(
                reactContext.contentResolver,
                "enabled_notification_listeners"
            ) ?: ""
            val target = ComponentName(
                reactContext,
                WhatsAppNotificationListener::class.java
            )
            val enabled = flat.split(":").any { entry ->
                ComponentName.unflattenFromString(entry) == target
            }
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openNotificationSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun checkCapturePermissions(promise: Promise) {
        try {
            val result = Arguments.createMap()
            result.putBoolean("recordAudio",
                ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO)
                    == PackageManager.PERMISSION_GRANTED)
            result.putBoolean("readPhoneState",
                ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE)
                    == PackageManager.PERMISSION_GRANTED)
            result.putBoolean("readCallLog",
                ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_CALL_LOG)
                    == PackageManager.PERMISSION_GRANTED)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                result.putBoolean("postNotifications",
                    ContextCompat.checkSelfPermission(reactContext, Manifest.permission.POST_NOTIFICATIONS)
                        == PackageManager.PERMISSION_GRANTED)
            } else {
                result.putBoolean("postNotifications", true)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestCapturePermissions(promise: Promise) {
        try {
            val activity = reactContext.currentActivity as? PermissionAwareActivity
                ?: return promise.reject("NO_ACTIVITY", "No activity available")

            val permissions = mutableListOf(
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.READ_CALL_LOG
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }

            activity.requestPermissions(permissions.toTypedArray(), REQUEST_CODE,
                PermissionListener { requestCode, _, grantResults ->
                    if (requestCode == REQUEST_CODE) {
                        val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
                        promise.resolve(allGranted)
                        true
                    } else {
                        false
                    }
                }
            )
        } catch (e: Exception) {
            promise.reject("PERMISSION_REQUEST_ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAppSettings() {
        val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = android.net.Uri.fromParts("package", reactContext.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }
}
