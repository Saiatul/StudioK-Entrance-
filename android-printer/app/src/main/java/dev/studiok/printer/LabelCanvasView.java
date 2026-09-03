package dev.studiok.printer;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom View that renders a 50×20mm badge at screen scale and lets the user
 * drag each element (logo / name / role) to reposition it on the label.
 * Long-press an element to resize (toggles between move and resize mode).
 */
public class LabelCanvasView extends View {

    private static final float LABEL_W_MM = 50f;
    private static final float LABEL_H_MM = 20f;

    private final List<TemplateElement> elements = new ArrayList<>();
    private Bitmap logoBitmap;

    // Drawing helpers
    private final Paint bgPaint = new Paint();
    private final Paint borderPaint = new Paint();
    private final Paint selPaint = new Paint();
    private final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint handlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    // Scale: pixels-per-mm (computed in onSizeChanged)
    private float sx, sy;
    private float offsetX, offsetY; // centering offset

    // Interaction state
    private TemplateElement selected;
    private boolean resizeMode;
    private float touchStartX, touchStartY;
    private float elemStartX, elemStartY, elemStartW, elemStartH;

    private OnTemplateChangedListener listener;

    public interface OnTemplateChangedListener {
        void onTemplateChanged();
    }

    public LabelCanvasView(Context context) { this(context, null); }

    public LabelCanvasView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        bgPaint.setColor(Color.WHITE);
        borderPaint.setColor(Color.parseColor("#888888"));
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(2f);

        selPaint.setColor(Color.parseColor("#E07030"));
        selPaint.setStyle(Paint.Style.STROKE);
        selPaint.setStrokeWidth(3f);
        selPaint.setPathEffect(new DashPathEffect(new float[]{10, 6}, 0));

        handlePaint.setColor(Color.parseColor("#E07030"));
        handlePaint.setStyle(Paint.Style.FILL);

        textPaint.setColor(Color.BLACK);
    }

    public void setLogoBitmap(Bitmap bmp) {
        logoBitmap = bmp;
        invalidate();
    }

    public void setElements(List<TemplateElement> elems) {
        elements.clear();
        elements.addAll(elems);
        selected = null;
        invalidate();
    }

    public List<TemplateElement> getElements() {
        return elements;
    }

    public void setOnTemplateChangedListener(OnTemplateChangedListener l) {
        listener = l;
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldW, int oldH) {
        super.onSizeChanged(w, h, oldW, oldH);
        float scaleX = w / LABEL_W_MM;
        float scaleY = h / LABEL_H_MM;
        float scale = Math.min(scaleX, scaleY);
        sx = scale;
        sy = scale;
        offsetX = (w - LABEL_W_MM * sx) / 2f;
        offsetY = (h - LABEL_H_MM * sy) / 2f;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        // Background
        RectF labelRect = new RectF(offsetX, offsetY,
                offsetX + LABEL_W_MM * sx, offsetY + LABEL_H_MM * sy);
        canvas.drawRect(labelRect, bgPaint);
        canvas.drawRect(labelRect, borderPaint);

        for (TemplateElement elem : elements) {
            RectF r = toScreen(elem);
            switch (elem.kind) {
                case LOGO:
                    if (logoBitmap != null) {
                        canvas.drawBitmap(logoBitmap, null, r, null);
                    } else {
                        Paint p = new Paint();
                        p.setColor(Color.LTGRAY);
                        canvas.drawRect(r, p);
                    }
                    break;
                case NAME:
                    textPaint.setTextSize(elem.fontMm * sy);
                    canvas.drawText("GUEST NAME", r.left, r.top + elem.fontMm * sy, textPaint);
                    break;
                case ROLE:
                    textPaint.setTextSize(elem.fontMm * sy);
                    canvas.drawText("FOUNDER", r.left, r.top + elem.fontMm * sy, textPaint);
                    break;
            }

            // Selection highlight
            if (elem == selected) {
                canvas.drawRect(r, selPaint);
                // Resize handle (bottom-right corner)
                float hs = 14f;
                canvas.drawRect(r.right - hs, r.bottom - hs, r.right, r.bottom, handlePaint);
            }
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();

        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                touchStartX = x;
                touchStartY = y;

                // Check resize handle first
                if (selected != null) {
                    RectF sr = toScreen(selected);
                    float hs = 20f;
                    if (x >= sr.right - hs && y >= sr.bottom - hs && x <= sr.right + 8 && y <= sr.bottom + 8) {
                        resizeMode = true;
                        elemStartW = selected.wMm;
                        elemStartH = selected.hMm;
                        return true;
                    }
                }

                // Hit-test elements (reverse order for z)
                resizeMode = false;
                TemplateElement hit = null;
                for (int i = elements.size() - 1; i >= 0; i--) {
                    RectF r = toScreen(elements.get(i));
                    if (r.contains(x, y)) {
                        hit = elements.get(i);
                        break;
                    }
                }
                selected = hit;
                if (hit != null) {
                    elemStartX = hit.xMm;
                    elemStartY = hit.yMm;
                }
                invalidate();
                return true;

            case MotionEvent.ACTION_MOVE:
                if (selected == null) return true;
                float dx = (x - touchStartX) / sx;
                float dy = (y - touchStartY) / sy;
                if (resizeMode) {
                    selected.wMm = Math.max(4f, elemStartW + dx);
                    selected.hMm = Math.max(3f, elemStartH + dy);
                } else {
                    selected.xMm = clamp(elemStartX + dx, 0, LABEL_W_MM - selected.wMm);
                    selected.yMm = clamp(elemStartY + dy, 0, LABEL_H_MM - selected.hMm);
                }
                invalidate();
                return true;

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                resizeMode = false;
                if (listener != null) listener.onTemplateChanged();
                return true;
        }
        return super.onTouchEvent(event);
    }

    /** Returns the currently selected element or null. */
    public TemplateElement getSelected() {
        return selected;
    }

    private RectF toScreen(TemplateElement e) {
        return new RectF(
                offsetX + e.xMm * sx,
                offsetY + e.yMm * sy,
                offsetX + (e.xMm + e.wMm) * sx,
                offsetY + (e.yMm + e.hMm) * sy
        );
    }

    private float clamp(float v, float min, float max) {
        return Math.max(min, Math.min(max, v));
    }
}
