package dev.studiok.printer;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Full-screen drag-and-drop badge template editor.
 * Users can move and resize Logo, Name, and Role on the 50×20mm canvas,
 * adjust font sizes, then save. Every future print uses the saved positions.
 */
public class TemplateEditorActivity extends Activity {

    private static final String PREFS = "studiok.printer";

    // SharedPreferences keys for each element (x, y, w, h, font)
    private static final String P_LOGO  = "tpl2_logo_";
    private static final String P_NAME  = "tpl2_name_";
    private static final String P_ROLE  = "tpl2_role_";

    private SharedPreferences prefs;
    private LabelCanvasView canvas;
    private LinearLayout propsPanel;
    private TextView tvSelectedLabel;
    private EditText etFontSize;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_template_editor);

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);

        canvas = findViewById(R.id.labelCanvas);
        propsPanel = findViewById(R.id.propsPanel);
        tvSelectedLabel = findViewById(R.id.tvSelectedLabel);
        etFontSize = findViewById(R.id.etFontSize);
        Button btnApplyFont = findViewById(R.id.btnApplyFont);
        Button btnReset = findViewById(R.id.btnReset);
        Button btnSave = findViewById(R.id.btnSave);

        canvas.setLogoBitmap(loadLogo());
        canvas.setElements(loadElements());

        canvas.setOnTemplateChangedListener(() -> {
            // Show properties panel when an element is selected
            TemplateElement sel = canvas.getSelected();
            if (sel != null) {
                propsPanel.setVisibility(View.VISIBLE);
                tvSelectedLabel.setText(sel.kind.name());
                etFontSize.setText(String.valueOf(sel.fontMm));
                etFontSize.setEnabled(sel.kind != TemplateElement.Kind.LOGO);
            } else {
                propsPanel.setVisibility(View.GONE);
            }
        });

        btnApplyFont.setOnClickListener(v -> {
            TemplateElement sel = canvas.getSelected();
            if (sel == null || sel.kind == TemplateElement.Kind.LOGO) return;
            try {
                float f = Float.parseFloat(etFontSize.getText().toString());
                sel.fontMm = Math.max(1f, Math.min(10f, f));
                canvas.invalidate();
            } catch (NumberFormatException ignored) {}
        });

        btnReset.setOnClickListener(v -> {
            canvas.setElements(defaultElements());
            propsPanel.setVisibility(View.GONE);
            Toast.makeText(this, "Reset to defaults", Toast.LENGTH_SHORT).show();
        });

        btnSave.setOnClickListener(v -> {
            saveElements(canvas.getElements());
            setResult(RESULT_OK);
            Toast.makeText(this, "Template saved ✓", Toast.LENGTH_SHORT).show();
            finish();
        });
    }

    // ── Persistence ─────────────────────────────────────────────────────

    private List<TemplateElement> loadElements() {
        List<TemplateElement> list = new ArrayList<>();
        list.add(loadElem(P_LOGO, TemplateElement.defaultLogo()));
        list.add(loadElem(P_NAME, TemplateElement.defaultName()));
        list.add(loadElem(P_ROLE, TemplateElement.defaultRole()));
        return list;
    }

    private TemplateElement loadElem(String prefix, TemplateElement def) {
        float x = prefs.getFloat(prefix + "x", def.xMm);
        float y = prefs.getFloat(prefix + "y", def.yMm);
        float w = prefs.getFloat(prefix + "w", def.wMm);
        float h = prefs.getFloat(prefix + "h", def.hMm);
        float f = prefs.getFloat(prefix + "f", def.fontMm);
        return new TemplateElement(def.kind, x, y, w, h, f);
    }

    private void saveElements(List<TemplateElement> elems) {
        SharedPreferences.Editor ed = prefs.edit();
        for (TemplateElement e : elems) {
            String prefix = prefixFor(e.kind);
            ed.putFloat(prefix + "x", e.xMm);
            ed.putFloat(prefix + "y", e.yMm);
            ed.putFloat(prefix + "w", e.wMm);
            ed.putFloat(prefix + "h", e.hMm);
            ed.putFloat(prefix + "f", e.fontMm);
        }
        ed.apply();
    }

    private static String prefixFor(TemplateElement.Kind kind) {
        switch (kind) {
            case LOGO: return P_LOGO;
            case NAME: return P_NAME;
            case ROLE: return P_ROLE;
        }
        return P_NAME;
    }

    private static List<TemplateElement> defaultElements() {
        List<TemplateElement> list = new ArrayList<>();
        list.add(TemplateElement.defaultLogo());
        list.add(TemplateElement.defaultName());
        list.add(TemplateElement.defaultRole());
        return list;
    }

    private Bitmap loadLogo() {
        InputStream stream = null;
        try {
            stream = getAssets().open("studiok-mark.png");
            return BitmapFactory.decodeStream(stream);
        } catch (IOException e) {
            return null;
        } finally {
            if (stream != null) try { stream.close(); } catch (IOException ignored) {}
        }
    }
}
