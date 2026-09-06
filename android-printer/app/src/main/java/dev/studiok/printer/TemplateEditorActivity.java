package dev.studiok.printer;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
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
 * Drag-and-drop badge template editor.
 * Tap × on an element to remove it; use Add buttons to put it back.
 */
public class TemplateEditorActivity extends Activity {

    private static final String PREFS = "studiok.printer";

    private static final String P_LOGO = "tpl3_logo_";
    private static final String P_NAME = "tpl3_name_";
    private static final String P_ROLE = "tpl3_role_";
    private static final String P_ASSOC = "tpl3_assoc_";

    private SharedPreferences prefs;
    private LabelCanvasView canvas;
    private LinearLayout propsPanel;
    private LinearLayout addBackRow;
    private TextView tvSelectedLabel;
    private EditText etFontSize;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_template_editor);

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);

        canvas = findViewById(R.id.labelCanvas);
        propsPanel = findViewById(R.id.propsPanel);
        addBackRow = findViewById(R.id.addBackRow);
        tvSelectedLabel = findViewById(R.id.tvSelectedLabel);
        etFontSize = findViewById(R.id.etFontSize);
        Button btnApplyFont = findViewById(R.id.btnApplyFont);
        Button btnReset = findViewById(R.id.btnReset);
        Button btnSave = findViewById(R.id.btnSave);

        canvas.setLogoBitmap(loadLogo());
        canvas.setElements(loadElements());
        refreshAddBackButtons();

        canvas.setOnTemplateChangedListener(() -> {
            refreshAddBackButtons();
            TemplateElement sel = canvas.getSelected();
            if (sel != null && sel.visible) {
                propsPanel.setVisibility(View.VISIBLE);
                String label = sel.kind == TemplateElement.Kind.ASSOCIATED
                        ? "ASSOCIATED TO"
                        : sel.kind.name();
                tvSelectedLabel.setText(label);
                etFontSize.setText(String.valueOf(sel.fontMm));
                etFontSize.setEnabled(sel.kind != TemplateElement.Kind.LOGO);
            } else {
                propsPanel.setVisibility(View.GONE);
            }
        });

        btnApplyFont.setOnClickListener(v -> {
            TemplateElement sel = canvas.getSelected();
            if (sel == null || !sel.visible || sel.kind == TemplateElement.Kind.LOGO) return;
            try {
                float f = Float.parseFloat(etFontSize.getText().toString());
                sel.fontMm = Math.max(1f, Math.min(10f, f));
                canvas.invalidate();
            } catch (NumberFormatException ignored) {
            }
        });

        btnReset.setOnClickListener(v -> {
            canvas.setElements(defaultElements());
            propsPanel.setVisibility(View.GONE);
            refreshAddBackButtons();
            Toast.makeText(this, "Reset to defaults", Toast.LENGTH_SHORT).show();
        });

        btnSave.setOnClickListener(v -> {
            saveElements(canvas.getElements());
            setResult(RESULT_OK);
            Toast.makeText(this, "Template saved ✓", Toast.LENGTH_SHORT).show();
            finish();
        });
    }

    private void refreshAddBackButtons() {
        addBackRow.removeAllViews();
        boolean anyHidden = false;
        for (TemplateElement.Kind kind : TemplateElement.Kind.values()) {
            if (canvas.hasKind(kind)) continue;
            anyHidden = true;
            Button btn = new Button(this);
            btn.setText("＋ " + labelFor(kind));
            btn.setAllCaps(false);
            btn.setTextColor(getResources().getColor(R.color.cream));
            btn.setBackgroundResource(R.drawable.btn_panel);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(0, 0, 12, 0);
            btn.setLayoutParams(lp);
            btn.setOnClickListener(v -> {
                canvas.showKind(kind);
                refreshAddBackButtons();
            });
            addBackRow.addView(btn);
        }
        addBackRow.setVisibility(anyHidden ? View.VISIBLE : View.GONE);
    }

    private static String labelFor(TemplateElement.Kind kind) {
        switch (kind) {
            case LOGO:
                return "Logo";
            case NAME:
                return "Name";
            case ROLE:
                return "Role";
            case ASSOCIATED:
                return "Associated";
        }
        return kind.name();
    }

    private List<TemplateElement> loadElements() {
        List<TemplateElement> list = new ArrayList<>();
        list.add(loadElem(P_LOGO, TemplateElement.defaultLogo()));
        list.add(loadElem(P_NAME, TemplateElement.defaultName()));
        list.add(loadElem(P_ROLE, TemplateElement.defaultRole()));
        list.add(loadElem(P_ASSOC, TemplateElement.defaultAssociated()));
        return list;
    }

    private TemplateElement loadElem(String prefix, TemplateElement def) {
        float x = prefs.getFloat(prefix + "x", def.xMm);
        float y = prefs.getFloat(prefix + "y", def.yMm);
        float w = prefs.getFloat(prefix + "w", def.wMm);
        float h = prefs.getFloat(prefix + "h", def.hMm);
        float f = prefs.getFloat(prefix + "f", def.fontMm);
        boolean vis = prefs.getBoolean(prefix + "vis", true);
        return new TemplateElement(def.kind, x, y, w, h, f, vis);
    }

    private void saveElements(List<TemplateElement> elems) {
        SharedPreferences.Editor ed = prefs.edit();
        // Ensure all kinds are written (including hidden)
        for (TemplateElement.Kind kind : TemplateElement.Kind.values()) {
            TemplateElement found = null;
            for (TemplateElement e : elems) {
                if (e.kind == kind) {
                    found = e;
                    break;
                }
            }
            if (found == null) {
                found = TemplateElement.defaultFor(kind);
                found.visible = false;
            }
            String prefix = prefixFor(kind);
            ed.putFloat(prefix + "x", found.xMm);
            ed.putFloat(prefix + "y", found.yMm);
            ed.putFloat(prefix + "w", found.wMm);
            ed.putFloat(prefix + "h", found.hMm);
            ed.putFloat(prefix + "f", found.fontMm);
            ed.putBoolean(prefix + "vis", found.visible);
        }
        ed.apply();
    }

    private static String prefixFor(TemplateElement.Kind kind) {
        switch (kind) {
            case LOGO:
                return P_LOGO;
            case NAME:
                return P_NAME;
            case ROLE:
                return P_ROLE;
            case ASSOCIATED:
                return P_ASSOC;
        }
        return P_NAME;
    }

    private static List<TemplateElement> defaultElements() {
        List<TemplateElement> list = new ArrayList<>();
        list.add(TemplateElement.defaultLogo());
        list.add(TemplateElement.defaultName());
        list.add(TemplateElement.defaultRole());
        list.add(TemplateElement.defaultAssociated());
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
            if (stream != null) {
                try {
                    stream.close();
                } catch (IOException ignored) {
                }
            }
        }
    }
}
