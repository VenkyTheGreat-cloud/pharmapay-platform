package com.pharmapay.delivery.capture

import android.content.Context

object CapturePrefs {

    private const val PREFS_NAME = "pharmagig_capture"

    fun setStoreToken(ctx: Context, token: String) =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("store_token", token).apply()

    fun getStoreToken(ctx: Context): String =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("store_token", "") ?: ""

    fun getApiBaseUrl(ctx: Context): String =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("api_base_url", "") ?: ""

    fun setApiBaseUrl(ctx: Context, url: String) =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("api_base_url", url).apply()

    fun savePendingCallerNumber(ctx: Context, number: String?) =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("pending_caller", number).apply()

    fun getPendingCallerNumber(ctx: Context): String? =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("pending_caller", null)
}
