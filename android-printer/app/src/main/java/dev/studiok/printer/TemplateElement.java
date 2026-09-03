package dev.studiok.printer;

import android.graphics.RectF;

/**
 * A single draggable element on the badge template.
 * All coordinates are in millimetres relative to the label (50×20).
 */
public class TemplateElement {
    public enum Kind { LOGO, NAME, ROLE }

    public final Kind kind;
    /** Position and size in mm. */
    public float xMm, yMm, wMm, hMm;
    /** Font size in mm (text elements only). */
    public float fontMm;

    public TemplateElement(Kind kind, float xMm, float yMm, float wMm, float hMm, float fontMm) {
        this.kind = kind;
        this.xMm = xMm;
        this.yMm = yMm;
        this.wMm = wMm;
        this.hMm = hMm;
        this.fontMm = fontMm;
    }

    /** Convert to pixel rect given scale factors. */
    public RectF toPixelRect(float sx, float sy) {
        return new RectF(xMm * sx, yMm * sy, (xMm + wMm) * sx, (yMm + hMm) * sy);
    }

    /** Defaults for 50×20mm two-column layout. */
    public static TemplateElement defaultLogo() {
        return new TemplateElement(Kind.LOGO, 1.5f, 2f, 21f, 16f, 0);
    }

    public static TemplateElement defaultName() {
        return new TemplateElement(Kind.NAME, 25f, 2f, 23f, 9f, 5.0f);
    }

    public static TemplateElement defaultRole() {
        return new TemplateElement(Kind.ROLE, 25f, 12f, 23f, 6f, 3.0f);
    }
}
