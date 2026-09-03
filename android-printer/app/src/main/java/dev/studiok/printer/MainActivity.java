package dev.studiok.printer;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.View;
import android.widget.EditText;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.dothantech.lpapi.LPAPI;
import com.dothantech.printer.IDzPrinter;
import com.dothantech.printer.IDzPrinter.PrinterAddress;
import com.dothantech.printer.IDzPrinter.PrinterState;
import com.dothantech.printer.IDzPrinter.PrintProgress;
import com.dothantech.printer.IDzPrinter.ProgressInfo;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String PREFS = "studiok.printer";
    private static final String KEY_NAME = "last_name";
    private static final String KEY_MAC = "last_mac";
    private static final String KEY_TYPE = "last_type";

    private static final int REQ_TEMPLATE_EDITOR = 100;
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER = "https://studiok-entrance-production.up.railway.app";
    private static final long POLL_INTERVAL_MS = 3000;

    // New drag-and-drop template keys (tpl2_ prefix)
    private static final String P_LOGO = "tpl2_logo_";
    private static final String P_NAME = "tpl2_name_";
    private static final String P_ROLE = "tpl2_role_";
    private static final double LABEL_WIDTH_MM = 50;
    private static final double LABEL_HEIGHT_MM = 20;
    private static final int LABEL_GAP_TYPE = 2;
    private static final int LABEL_GAP_MM = 2;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final List<PrinterAddress> discovered = new ArrayList<>();

    private LPAPI api;
    private SharedPreferences prefs;
    private PrinterListAdapter printerAdapter;
    private AlertDialog picker;
    private AlertDialog busyDialog;

    private TextView statusTitle;
    private TextView statusDetail;
    private ImageView previewImage;
    private Button btnConnect;
    private Button btnTest;
    private Button btnDisconnect;

    private String pendingGuestName;
    private String pendingRole;
    private boolean pendingTest;
    private boolean pendingPicker;
    private boolean connecting;
    private Intent pendingLaunchIntent;
    private Bitmap logoMark;
    private boolean polling;

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            if (!polling) return;
            new Thread(() -> {
                try {
                    String serverUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER);
                    URL url = new URL(serverUrl + "/api/print-queue");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);
                    int code = conn.getResponseCode();
                    if (code == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) sb.append(line);
                        reader.close();
                        JSONObject json = new JSONObject(sb.toString());
                        JSONArray jobs = json.optJSONArray("jobs");
                        if (jobs != null && jobs.length() > 0) {
                            for (int i = 0; i < jobs.length(); i++) {
                                JSONObject job = jobs.getJSONObject(i);
                                String name = job.optString("name", "GUEST");
                                String role = job.optString("role", "");
                                ui.post(() -> printBadge(name, role, false));
                            }
                        }
                    }
                    conn.disconnect();
                } catch (Exception ignored) {
                }
                ui.postDelayed(pollRunnable, POLL_INTERVAL_MS);
            }).start();
        }
    };

    // Drag-and-drop template elements (loaded from SharedPreferences)
    private TemplateElement tplLogo = TemplateElement.defaultLogo();
    private TemplateElement tplName = TemplateElement.defaultName();
    private TemplateElement tplRole = TemplateElement.defaultRole();

    private final LPAPI.Callback callback = new LPAPI.Callback() {
        @Override
        public void onStateChange(PrinterAddress address, PrinterState state) {
            if (state == PrinterState.Connected || state == PrinterState.Connected2) {
                ui.post(() -> onPrinterConnected(address));
            } else if (state == PrinterState.Disconnected) {
                ui.post(MainActivity.this::onPrinterDisconnected);
            }
        }

        @Override
        public void onProgressInfo(ProgressInfo info, Object extra) {
        }

        @Override
        public void onPrinterDiscovery(PrinterAddress address, Object extra) {
            onPrinterFound(address);
        }

        @Override
        public void onPrintProgress(
                PrinterAddress address,
                IDzPrinter.PrintData data,
                PrintProgress progress,
                Object extra
        ) {
            if (progress == PrintProgress.Success) {
                ui.post(MainActivity.this::onPrintSuccess);
            } else if (progress == PrintProgress.Failed) {
                ui.post(MainActivity.this::onPrintFailed);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        printerAdapter = new PrinterListAdapter(this);
        api = LPAPI.Factory.createInstance(callback);
        logoMark = loadLogoMark();

        statusTitle = findViewById(R.id.statusTitle);
        statusDetail = findViewById(R.id.statusDetail);
        previewImage = findViewById(R.id.previewImage);
        btnConnect = findViewById(R.id.btnConnect);
        btnTest = findViewById(R.id.btnTest);
        Button btnEditTemplate = findViewById(R.id.btnEditTemplate);
        btnDisconnect = findViewById(R.id.btnDisconnect);

        Button btnSetServer = findViewById(R.id.btnSetServer);

        btnConnect.setOnClickListener(v -> startConnect(true));
        btnTest.setOnClickListener(v -> printBadge(getString(R.string.test_name), "Founder", true));
        btnEditTemplate.setOnClickListener(v -> openTemplateEditor());
        btnSetServer.setOnClickListener(v -> showServerUrlDialog());
        btnDisconnect.setOnClickListener(v -> disconnectPrinter());

        pendingLaunchIntent = getIntent();
        requestPrinterPermissions();
        refreshStatus();
        loadTemplate();
        updatePreview(getString(R.string.test_name), "FOUNDER");

        // Auto-start polling if printer was previously connected
        if (isPrinterConnected()) {
            startPolling();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        pendingLaunchIntent = intent;
        if (hasPrinterPermissions()) {
            handleIntent(intent);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (!hasPrinterPermissions()) {
            toast(getString(R.string.need_permissions));
            return;
        }
        handleIntent(pendingLaunchIntent);
        tryReconnectLastPrinter();
        refreshStatus();
    }

    @Override
    protected void onDestroy() {
        stopPolling();
        if (api != null) {
            api.quit();
        }
        super.onDestroy();
    }

    private void startPolling() {
        if (polling) return;
        polling = true;
        ui.post(pollRunnable);
        toast("Listening for print jobs from website");
    }

    private void stopPolling() {
        polling = false;
        ui.removeCallbacks(pollRunnable);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) {
            return;
        }

        Uri uri = intent.getData();
        if (uri == null || !"studiok".equals(uri.getScheme())) {
            return;
        }

        String host = uri.getHost();
        if ("connect".equals(host)) {
            startConnect(true);
            return;
        }
        if ("disconnect".equals(host)) {
            disconnectPrinter();
            return;
        }
        if ("test".equals(host)) {
            printBadge(getString(R.string.test_name), "Founder", true);
            return;
        }
        if ("print".equals(host)) {
            String name = uri.getQueryParameter("name");
            String role = uri.getQueryParameter("role");
            printBadge(name, role, false);
        }
    }

    private void requestPrinterPermissions() {
        List<String> needed = new ArrayList<>();
        needed.add(Manifest.permission.ACCESS_FINE_LOCATION);
        needed.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        if (Build.VERSION.SDK_INT >= 31) {
            needed.add(Manifest.permission.BLUETOOTH_SCAN);
            needed.add(Manifest.permission.BLUETOOTH_CONNECT);
        } else {
            needed.add(Manifest.permission.BLUETOOTH);
        }
        requestPermissions(needed.toArray(new String[0]), 41);
    }

    private boolean hasPrinterPermissions() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        if (Build.VERSION.SDK_INT >= 31) {
            return checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT)
                    == PackageManager.PERMISSION_GRANTED
                    && checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    private void startConnect(boolean showPicker) {
        if (!hasPrinterPermissions()) {
            toast(getString(R.string.need_permissions));
            requestPrinterPermissions();
            return;
        }

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            toast(getString(R.string.bluetooth_missing));
            return;
        }
        if (!adapter.isEnabled()) {
            toast(getString(R.string.bluetooth_off));
            return;
        }

        if (isPrinterConnected()) {
            refreshStatus();
            flushPendingPrint();
            return;
        }

        pendingPicker = showPicker;
        if (tryReconnectLastPrinter()) {
            return;
        }

        beginDiscovery(showPicker);
    }

    private boolean tryReconnectLastPrinter() {
        if (isPrinterConnected() || api == null) {
            return isPrinterConnected();
        }

        try {
            if (api.reopenPrinter()) {
                connecting = true;
                showBusy(getString(R.string.status_connecting));
                return true;
            }
        } catch (Throwable ignored) {
        }

        PrinterAddress last = savedPrinter();
        if (last == null) {
            return false;
        }

        if (api.openPrinterByAddress(last)) {
            connecting = true;
            showBusy(getString(R.string.status_connecting));
            statusTitle.setText(R.string.status_connecting);
            statusDetail.setText(displayName(last));
            return true;
        }
        return false;
    }

    private void beginDiscovery(boolean showPicker) {
        discovered.clear();
        printerAdapter.setPrinters(discovered);
        api.stopDiscovery();
        api.discovery();

        if (showPicker) {
            if (picker != null && picker.isShowing()) {
                printerAdapter.notifyDataSetChanged();
                return;
            }
            picker = new AlertDialog.Builder(this)
                    .setTitle(R.string.select_printer)
                    .setAdapter(printerAdapter, (dialog, which) -> {
                        api.stopDiscovery();
                        connectTo(printerAdapter.getPrinter(which));
                    })
                    .setOnDismissListener(dialog -> {
                        api.stopDiscovery();
                        picker = null;
                    })
                    .setNegativeButton(android.R.string.cancel, null)
                    .show();
        }
    }

    private void onPrinterFound(PrinterAddress address) {
        if (address == null || TextUtils.isEmpty(address.shownName)) {
            return;
        }
        for (PrinterAddress existing : discovered) {
            if (TextUtils.equals(existing.shownName, address.shownName)
                    && TextUtils.equals(existing.macAddress, address.macAddress)) {
                return;
            }
        }
        discovered.add(address);
        ui.post(() -> {
            printerAdapter.setPrinters(discovered);
            if (!pendingPicker && savedPrinter() != null) {
                PrinterAddress last = savedPrinter();
                if (TextUtils.equals(last.macAddress, address.macAddress)
                        || TextUtils.equals(last.shownName, address.shownName)) {
                    api.stopDiscovery();
                    connectTo(address);
                }
            }
        });
    }

    private void connectTo(PrinterAddress printer) {
        if (printer == null) {
            return;
        }
        if (api.openPrinterByAddress(printer)) {
            connecting = true;
            showBusy(getString(R.string.status_connecting));
            statusTitle.setText(R.string.status_connecting);
            statusDetail.setText(displayName(printer));
        } else {
            connecting = false;
            toast(getString(R.string.connect_failed));
        }
    }

    private void onPrinterConnected(PrinterAddress printer) {
        connecting = false;
        hideBusy();
        savePrinter(printer);
        applyLabelSettings();
        toast(getString(R.string.connected_ok));
        refreshStatus();
        flushPendingPrint();
        startPolling();
    }

    private void onPrinterDisconnected() {
        boolean wasConnecting = connecting;
        connecting = false;
        hideBusy();
        refreshStatus();
        if (wasConnecting && (!TextUtils.isEmpty(pendingGuestName) || pendingTest)) {
            toast(getString(R.string.connect_failed));
            beginDiscovery(true);
        }
    }

    private void disconnectPrinter() {
        pendingGuestName = null;
        pendingRole = null;
        pendingTest = false;
        connecting = false;
        if (api != null) {
            try {
                api.closePrinter();
            } catch (Throwable ignored) {
            }
        }
        refreshStatus();
    }

    private void applyLabelSettings() {
        try {
            api.setPrintPageGapType(LABEL_GAP_TYPE);
            api.setPrintPageGapLength(LABEL_GAP_MM);
        } catch (Throwable ignored) {
        }
    }

    private void printBadge(String rawName, String rawRole, boolean test) {
        String name = normalizeName(rawName, test);
        String role = normalizeRole(rawRole, test);

        updatePreview(name, role);

        if (!isPrinterConnected()) {
            pendingGuestName = name;
            pendingRole = role;
            pendingTest = test;
            startConnect(savedPrinter() == null);
            return;
        }

        showBusy(getString(R.string.status_printing));
        boolean submitted = drawAndCommit(name, role);
        if (!submitted) {
            onPrintFailed();
        }
    }

    private void flushPendingPrint() {
        if (!isPrinterConnected()) {
            return;
        }
        if (pendingTest) {
            pendingTest = false;
            String name = pendingGuestName;
            String role = pendingRole;
            pendingGuestName = null;
            pendingRole = null;
            printBadge(name, role, true);
            return;
        }
        if (!TextUtils.isEmpty(pendingGuestName)) {
            String name = pendingGuestName;
            String role = pendingRole;
            pendingGuestName = null;
            pendingRole = null;
            printBadge(name, role, false);
        }
    }

    private boolean drawAndCommit(String name, String role) {
        api.startJob(LABEL_WIDTH_MM, LABEL_HEIGHT_MM, 0);

        if (logoMark != null) {
            api.drawBitmap(logoMark, tplLogo.xMm, tplLogo.yMm, tplLogo.wMm, tplLogo.hMm);
        }

        api.setItemHorizontalAlignment(0);
        api.setItemVerticalAlignment(0);

        // Use saved font or auto-size based on name length
        double nameFontMm = tplName.fontMm > 0 ? tplName.fontMm : nameFontMm(name);
        api.drawTextRegular(name, tplName.xMm, tplName.yMm, tplName.wMm, tplName.hMm, nameFontMm, 1);

        double roleFontMm = tplRole.fontMm > 0 ? tplRole.fontMm : 3.0;
        api.drawTextRegular(role, tplRole.xMm, tplRole.yMm, tplRole.wMm, tplRole.hMm, roleFontMm, 0);

        return api.commitJob();
    }

    private double nameFontMm(String name) {
        int length = name.length();
        if (length <= 8) {
            return 5.4;
        }
        if (length <= 12) {
            return 4.6;
        }
        if (length <= 18) {
            return 3.9;
        }
        if (length <= 24) {
            return 3.3;
        }
        return 3.0;
    }

    private void updatePreview(String name, String role) {
        if (previewImage == null || logoMark == null) return;

        int previewW = 400;
        int previewH = 160;
        float sx = previewW / (float) LABEL_WIDTH_MM;
        float sy = previewH / (float) LABEL_HEIGHT_MM;

        Bitmap preview = Bitmap.createBitmap(previewW, previewH, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(preview);
        canvas.drawColor(Color.WHITE);

        // Logo
        android.graphics.RectF dst = new android.graphics.RectF(
                tplLogo.xMm * sx, tplLogo.yMm * sy,
                (tplLogo.xMm + tplLogo.wMm) * sx, (tplLogo.yMm + tplLogo.hMm) * sy);
        canvas.drawBitmap(logoMark, null, dst, null);

        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.BLACK);

        // Name
        double nf = tplName.fontMm > 0 ? tplName.fontMm : nameFontMm(name);
        paint.setTextSize((float) (nf * sy));
        canvas.drawText(name, tplName.xMm * sx, tplName.yMm * sy + (float)(nf * sy), paint);

        // Role
        double rf = tplRole.fontMm > 0 ? tplRole.fontMm : 3.0;
        paint.setTextSize((float) (rf * sy));
        canvas.drawText(role, tplRole.xMm * sx, tplRole.yMm * sy + (float)(rf * sy), paint);

        previewImage.setImageBitmap(preview);
    }

    private void loadTemplate() {
        if (prefs == null) return;
        tplLogo = loadElem(P_LOGO, TemplateElement.defaultLogo());
        tplName = loadElem(P_NAME, TemplateElement.defaultName());
        tplRole = loadElem(P_ROLE, TemplateElement.defaultRole());
    }

    private TemplateElement loadElem(String prefix, TemplateElement def) {
        float x = prefs.getFloat(prefix + "x", def.xMm);
        float y = prefs.getFloat(prefix + "y", def.yMm);
        float w = prefs.getFloat(prefix + "w", def.wMm);
        float h = prefs.getFloat(prefix + "h", def.hMm);
        float f = prefs.getFloat(prefix + "f", def.fontMm);
        return new TemplateElement(def.kind, x, y, w, h, f);
    }

    private void openTemplateEditor() {
        Intent intent = new Intent(this, TemplateEditorActivity.class);
        startActivityForResult(intent, REQ_TEMPLATE_EDITOR);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_TEMPLATE_EDITOR) {
            // Reload template positions after editor closes
            loadTemplate();
            updatePreview(getString(R.string.test_name), "FOUNDER");
        }
    }

    private void showServerUrlDialog() {
        String current = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER);
        EditText input = new EditText(this);
        input.setText(current);
        input.setTextColor(getResources().getColor(R.color.cream));
        input.setSingleLine();

        new AlertDialog.Builder(this)
                .setTitle("Server URL")
                .setMessage("Enter the website URL (e.g. https://studiok-entrance-production.up.railway.app)")
                .setView(input)
                .setPositiveButton("Save", (d, w) -> {
                    String url = input.getText().toString().trim();
                    if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
                    prefs.edit().putString(KEY_SERVER_URL, url).apply();
                    toast("Server: " + url);
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show();
    }

    private String normalizeName(String rawName, boolean test) {
        String value = rawName == null ? "" : rawName.trim();
        if (TextUtils.isEmpty(value)) {
            return test ? getString(R.string.test_name) : "GUEST";
        }
        return value.toUpperCase(Locale.ROOT);
    }

    private String normalizeRole(String rawRole, boolean test) {
        String value = rawRole == null ? "" : rawRole.trim();
        if (TextUtils.isEmpty(value)) {
            return test ? "FOUNDER" : "";
        }
        return value.toUpperCase(Locale.ROOT);
    }

    private Bitmap loadLogoMark() {
        InputStream stream = null;
        try {
            stream = getAssets().open("studiok-mark.png");
            return BitmapFactory.decodeStream(stream);
        } catch (IOException ignored) {
            return null;
        } finally {
            if (stream != null) {
                try {
                    stream.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private boolean isPrinterConnected() {
        if (api == null) {
            return false;
        }
        try {
            if (api.isPrinterOpened()) {
                return true;
            }
        } catch (Throwable ignored) {
        }
        PrinterState state = api.getPrinterState();
        return state == PrinterState.Connected || state == PrinterState.Connected2;
    }

    private void refreshStatus() {
        if (isPrinterConnected()) {
            statusTitle.setText(R.string.status_connected);
            IDzPrinter.PrinterInfo info = null;
            try {
                info = api.getPrinterInfo();
            } catch (Throwable ignored) {
            }
            if (info != null && !TextUtils.isEmpty(info.deviceName)) {
                statusDetail.setText(info.deviceName);
            } else {
                statusDetail.setText(prefs.getString(KEY_NAME, getString(R.string.label_size)));
            }
            return;
        }
        statusTitle.setText(R.string.status_disconnected);
        String last = prefs.getString(KEY_NAME, "");
        statusDetail.setText(TextUtils.isEmpty(last) ? getString(R.string.label_size) : last);
    }

    private void savePrinter(PrinterAddress printer) {
        if (printer == null) {
            return;
        }
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_NAME, printer.shownName);
        editor.putString(KEY_MAC, printer.macAddress);
        if (printer.addressType != null) {
            editor.putString(KEY_TYPE, printer.addressType.name());
        }
        editor.apply();
    }

    private PrinterAddress savedPrinter() {
        String name = prefs.getString(KEY_NAME, "");
        String mac = prefs.getString(KEY_MAC, "");
        String type = prefs.getString(KEY_TYPE, IDzPrinter.AddressType.SPP.name());
        if (TextUtils.isEmpty(name) && TextUtils.isEmpty(mac)) {
            return null;
        }
        IDzPrinter.AddressType addressType;
        try {
            addressType = IDzPrinter.AddressType.valueOf(type);
        } catch (Exception ignored) {
            addressType = IDzPrinter.AddressType.SPP;
        }
        return new PrinterAddress(name, mac, addressType);
    }

    private String displayName(PrinterAddress printer) {
        if (printer == null) {
            return getString(R.string.label_size);
        }
        if (!TextUtils.isEmpty(printer.shownName)) {
            return printer.shownName;
        }
        return printer.macAddress;
    }

    private void onPrintSuccess() {
        hideBusy();
        toast(getString(R.string.print_ok));
        refreshStatus();
    }

    private void onPrintFailed() {
        hideBusy();
        toast(getString(R.string.print_failed));
        refreshStatus();
    }

    private void showBusy(String title) {
        if (busyDialog != null && busyDialog.isShowing()) {
            busyDialog.setTitle(title);
            return;
        }
        busyDialog = new AlertDialog.Builder(this)
                .setCancelable(false)
                .setTitle(title)
                .show();
    }

    private void hideBusy() {
        if (busyDialog != null && busyDialog.isShowing()) {
            busyDialog.dismiss();
        }
        busyDialog = null;
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
}
