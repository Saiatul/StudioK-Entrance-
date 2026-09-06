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
 * Badge canvas editor: drag/resize elements, tap × to remove, add back later.
 */
public class LabelCanvasView extends View {

    private static final float LABEL_W_MM = 50f;
    private static final float LABEL_H_MM = 20f;
    private static final float CROSS_SIZE_PX = 28f;

    private final List<TemplateElement> elements = new ArrayList<>();
    private Bitmap logoBitmap;

    private final Paint bgPaint = new Paint();
    private final Paint borderPaint = new Paint();
    private final Paint selPaint = new Paint();
    private final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint handlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint crossBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint crossPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private float sx, sy;
    private float offsetX, offsetY;

    private TemplateElement selected;
    private boolean resizeMode;
    private float touchStartX, touchStartY;
    private float elemStartX, elemStartY, elemStartW, elemStartH;

    private OnTemplateChangedListener listener;

    public interface OnTemplateChangedListener {
        void onTemplateChanged();
    }

    public LabelCanvasView(Context context) {
        this(context, null);
    }

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

        crossBgPaint.setColor(Color.parseColor("#C62828"));
        crossBgPaint.setStyle(Paint.Style.FILL);

        crossPaint.setColor(Color.WHITE);
        crossPaint.setStrokeWidth(3f);
        crossPaint.setStyle(Paint.Style.STROKE);
        crossPaint.setStrokeCap(Paint.Cap.ROUND);

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

    public TemplateElement getSelected() {
        return selected;
    }

    public boolean hasKind(TemplateElement.Kind kind) {
        for (TemplateElement e : elements) {
            if (e.kind == kind && e.visible) return true;
        }
        return false;
    }

    public void hideElement(TemplateElement elem) {
        if (elem == null) return;
        elem.visible = false;
        if (selected == elem) selected = null;
        invalidate();
        if (listener != null) listener.onTemplateChanged();
    }

    public void showKind(TemplateElement.Kind kind) {
        for (TemplateElement e : elements) {
            if (e.kind == kind) {
                e.visible = true;
                selected = e;
                invalidate();
                if (listener != null) listener.onTemplateChanged();
                return;
            }
        }
        TemplateElement created = TemplateElement.defaultFor(kind);
        created.visible = true;
        elements.add(created);
        selected = created;
        invalidate();
        if (listener != null) listener.onTemplateChanged();
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

        RectF labelRect = new RectF(
                offsetX,
                offsetY,
                offsetX + LABEL_W_MM * sx,
                offsetY + LABEL_H_MM * sy
        );
        canvas.drawRect(labelRect, bgPaint);
        canvas.drawRect(labelRect, borderPaint);

        for (TemplateElement elem : elements) {
            if (!elem.visible) continue;
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
                case ASSOCIATED:
                    textPaint.setTextSize(elem.fontMm * sy);
                    canvas.drawText("COMPANY", r.left, r.top + elem.fontMm * sy, textPaint);
                    break;
            }

            // Always show remove × on every visible element
            drawCross(canvas, crossRect(r));

            if (elem == selected) {
                canvas.drawRect(r, selPaint);
                float hs = 14f;
                canvas.drawRect(r.right - hs, r.bottom - hs, r.right, r.bottom, handlePaint);
            }
        }
    }

    private void drawCross(Canvas canvas, RectF cross) {
        canvas.drawOval(cross, crossBgPaint);
        float pad = 7f;
        canvas.drawLine(cross.left + pad, cross.top + pad, cross.right - pad, cross.bottom - pad, crossPaint);
        canvas.drawLine(cross.right - pad, cross.top + pad, cross.left + pad, cross.bottom - pad, crossPaint);
    }

    private RectF crossRect(RectF elemRect) {
        float size = CROSS_SIZE_PX;
        float cx = Math.min(elemRect.right, offsetX + LABEL_W_MM * sx) - 2f;
        float cy = Math.max(elemRect.top, offsetY) + 2f;
        return new RectF(cx - size, cy, cx, cy + size);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();

        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                touchStartX = x;
                touchStartY = y;

                // × remove hit first (any visible element)
                for (int i = elements.size() - 1; i >= 0; i--) {
                    TemplateElement e = elements.get(i);
                    if (!e.visible) continue;
                    if (crossRect(toScreen(e)).contains(x, y)) {
                        hideElement(e);
                        return true;
                    }
                }

                if (selected != null && selected.visible) {
                    RectF sr = toScreen(selected);
                    float hs = 20f;
                    if (x >= sr.right - hs && y >= sr.bottom - hs && x <= sr.right + 8 && y <= sr.bottom + 8) {
                        resizeMode = true;
                        elemStartW = selected.wMm;
                        elemStartH = selected.hMm;
                        return true;
                    }
                }

                resizeMode = false;
                TemplateElement hit = null;
                for (int i = elements.size() - 1; i >= 0; i--) {
                    TemplateElement e = elements.get(i);
                    if (!e.visible) continue;
                    if (toScreen(e).contains(x, y)) {
                        hit = e;
                        break;
                    }
                }
                selected = hit;
                if (hit != null) {
                    elemStartX = hit.xMm;
                    elemStartY = hit.yMm;
                }
                invalidate();
                if (listener != null) listener.onTemplateChanged();
                return true;

            case MotionEvent.ACTION_MOVE:
                if (selected == null || !selected.visible) return true;
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
