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

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String PREFS = "studiok.printer";
    private static final String KEY_NAME = "last_name";
    private static final String KEY_MAC = "last_mac";
    private static final String KEY_TYPE = "last_type";
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
        btnDisconnect = findViewById(R.id.btnDisconnect);

        btnConnect.setOnClickListener(v -> startConnect(true));
        btnTest.setOnClickListener(v -> printBadge(getString(R.string.test_name), "Founder", true));
        btnDisconnect.setOnClickListener(v -> disconnectPrinter());

        pendingLaunchIntent = getIntent();
        requestPrinterPermissions();
        refreshStatus();
        updatePreview(getString(R.string.test_name), "FOUNDER");
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
        if (api != null) {
            api.quit();
        }
        super.onDestroy();
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
            // Left column (logo only)
            api.drawBitmap(logoMark, 1.5, 2, 21, 16);
        }

        api.setItemHorizontalAlignment(0);
        api.setItemVerticalAlignment(0);
        double fontMm = nameFontMm(name);
        // Right column (name on top + role tag below)
        api.drawTextRegular(name, 25, 2, 23, 9, fontMm, 1);
        api.drawTextRegular(role, 25, 12, 23, 6, 3.0, 0);
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

        int previewW = 400; // px
        int previewH = 160; // px (50x20mm @ 8px/mm)
        float sx = previewW / (float) LABEL_WIDTH_MM; // 8
        float sy = previewH / (float) LABEL_HEIGHT_MM; // 8

        Bitmap preview = Bitmap.createBitmap(previewW, previewH, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(preview);
        canvas.drawColor(Color.WHITE);

        Paint line = new Paint();
        line.setColor(Color.parseColor("#dddddd"));
        // Column divider at x=25mm
        canvas.drawLine(25f * sx, 0, 25f * sx, previewH, line);

        Paint paint = new Paint();
        paint.setColor(Color.BLACK);
        paint.setAntiAlias(true);

        // Logo bitmap
        android.graphics.RectF dst = new android.graphics.RectF(
                1.5f * sx,
                2f * sy,
                (1.5f + 21f) * sx,
                (2f + 16f) * sy
        );
        canvas.drawBitmap(logoMark, null, dst, null);

        // Text (approximate baseline positioning)
        float textX = 25f * sx;
        double fontMm = nameFontMm(name);
        float nameFontPx = (float) (fontMm * sy);
        paint.setTextSize(nameFontPx);
        canvas.drawText(name, textX, (2f * sy) + nameFontPx, paint);

        float roleFontMm = 3.0f;
        float roleFontPx = roleFontMm * sy;
        paint.setTextSize(roleFontPx);
        canvas.drawText(role, textX, (12f * sy) + roleFontPx, paint);

        previewImage.setImageBitmap(preview);
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
