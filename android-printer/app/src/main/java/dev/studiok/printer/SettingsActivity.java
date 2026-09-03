package dev.studiok.printer;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class SettingsActivity extends Activity {
    public static final String ACTION_CONNECT = "connect";
    public static final String ACTION_TEST = "test";
    public static final String ACTION_DISCONNECT = "disconnect";

    private static final String PREFS = "studiok.printer";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER = "https://studiok-entrance-production.up.railway.app";

    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);

        findViewById(R.id.btnConnect).setOnClickListener(v -> runMainAction(ACTION_CONNECT));
        findViewById(R.id.btnTest).setOnClickListener(v -> runMainAction(ACTION_TEST));
        findViewById(R.id.btnDisconnect).setOnClickListener(v -> runMainAction(ACTION_DISCONNECT));
        findViewById(R.id.btnEditTemplate).setOnClickListener(v ->
                startActivity(new Intent(this, TemplateEditorActivity.class)));
        findViewById(R.id.btnSetServer).setOnClickListener(v -> showServerUrlDialog());
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
    }

    private void runMainAction(String action) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra(MainActivity.EXTRA_ACTION, action);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    private void showServerUrlDialog() {
        String current = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER);
        EditText input = new EditText(this);
        input.setText(current);
        input.setTextColor(getResources().getColor(R.color.cream));
        input.setSingleLine();

        new AlertDialog.Builder(this)
                .setTitle("Server URL")
                .setMessage("Enter the website URL")
                .setView(input)
                .setPositiveButton("Save", (d, w) -> {
                    String url = input.getText().toString().trim();
                    if (url.endsWith("/")) {
                        url = url.substring(0, url.length() - 1);
                    }
                    prefs.edit().putString(KEY_SERVER_URL, url).apply();
                    Toast.makeText(this, "Server: " + url, Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show();
    }
}
