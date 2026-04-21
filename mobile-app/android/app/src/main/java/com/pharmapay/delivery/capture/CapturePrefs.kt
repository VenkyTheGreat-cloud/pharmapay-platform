package com.pharmapay.delivery.capture

import android.content.Context
import android.database.sqlite.SQLiteDatabase

/**
 * Provides config for the capture service.
 *
 * Token resolution order:
 *   1. Own SharedPreferences (set explicitly via setStoreToken)
 *   2. React Native AsyncStorage SQLite DB (reads "token" key saved by JS login)
 *
 * This means if the store clerk logs in via the React Native app, the capture
 * service can immediately read the auth token — no native bridge needed.
 */
object CapturePrefs {

    private const val PREFS_NAME = "pharmagig_capture"
    private const val ASYNC_STORAGE_DB = "RKStorage"  // AsyncStorage SQLite DB name

    // --- Own SharedPreferences ---

    fun setStoreToken(ctx: Context, token: String) =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("store_token", token).apply()

    fun getStoreToken(ctx: Context): String {
        // First check own prefs
        val own = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("store_token", null)
        if (!own.isNullOrEmpty()) return own

        // Fallback: read from React Native AsyncStorage
        return readFromAsyncStorage(ctx, "token") ?: ""
    }

    fun getApiBaseUrl(ctx: Context): String {
        val own = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("api_base_url", null)
        if (!own.isNullOrEmpty()) return own

        // Default production URL
        return "https://pharmagig.swinkpay-fintech.com/api"
    }

    fun setApiBaseUrl(ctx: Context, url: String) =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("api_base_url", url).apply()

    fun savePendingCallerNumber(ctx: Context, number: String?) =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("pending_caller", number).apply()

    fun getPendingCallerNumber(ctx: Context): String? =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("pending_caller", null)

    // --- AsyncStorage Reader ---

    /**
     * Reads a value from React Native AsyncStorage's SQLite database.
     * AsyncStorage stores data in a table called "catalystLocalStorage"
     * with columns: key (TEXT), value (TEXT).
     */
    private fun readFromAsyncStorage(ctx: Context, key: String): String? {
        return try {
            val dbPath = ctx.getDatabasePath(ASYNC_STORAGE_DB).absolutePath
            val db = SQLiteDatabase.openDatabase(dbPath, null, SQLiteDatabase.OPEN_READONLY)
            db.use { database ->
                database.rawQuery(
                    "SELECT value FROM catalystLocalStorage WHERE key = ?",
                    arrayOf(key)
                ).use { cursor ->
                    if (cursor.moveToFirst()) {
                        cursor.getString(0)?.trim('"') // AsyncStorage wraps strings in quotes
                    } else null
                }
            }
        } catch (e: Exception) {
            // DB might not exist yet if user hasn't logged in
            null
        }
    }
}
