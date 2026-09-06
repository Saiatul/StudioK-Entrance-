package dev.studiok.printer;

import android.graphics.RectF;

/**
 * A single draggable element on the badge template.
 * All coordinates are in millimetres relative to the label (50×20).
 */
public class TemplateElement {
    public enum Kind { LOGO, NAME, ROLE, ASSOCIATED }

    public final Kind kind;
    /** Position and size in mm. */
    public float xMm, yMm, wMm, hMm;
    /** Font size in mm (text elements only). */
    public float fontMm;
    /** When false, element is hidden from editor and printing. */
    public boolean visible;

    public TemplateElement(Kind kind, float xMm, float yMm, float wMm, float hMm, float fontMm) {
        this(kind, xMm, yMm, wMm, hMm, fontMm, true);
    }

    public TemplateElement(
            Kind kind,
            float xMm,
            float yMm,
            float wMm,
            float hMm,
            float fontMm,
            boolean visible
    ) {
        this.kind = kind;
        this.xMm = xMm;
        this.yMm = yMm;
        this.wMm = wMm;
        this.hMm = hMm;
        this.fontMm = fontMm;
        this.visible = visible;
    }

    /** Convert to pixel rect given scale factors. */
    public RectF toPixelRect(float sx, float sy) {
        return new RectF(xMm * sx, yMm * sy, (xMm + wMm) * sx, (yMm + hMm) * sy);
    }

    /** Defaults for 50×20mm two-column layout with associated-to. */
    public static TemplateElement defaultLogo() {
        return new TemplateElement(Kind.LOGO, 1.5f, 2f, 21f, 16f, 0);
    }

    public static TemplateElement defaultName() {
        return new TemplateElement(Kind.NAME, 25f, 1.2f, 23f, 6.5f, 4.0f);
    }

    public static TemplateElement defaultRole() {
        return new TemplateElement(Kind.ROLE, 25f, 8.5f, 23f, 4.2f, 2.8f);
    }

    public static TemplateElement defaultAssociated() {
        return new TemplateElement(Kind.ASSOCIATED, 25f, 13.5f, 23f, 4.0f, 2.3f);
    }

    public static TemplateElement defaultFor(Kind kind) {
        switch (kind) {
            case LOGO:
                return defaultLogo();
            case NAME:
                return defaultName();
            case ROLE:
                return defaultRole();
            case ASSOCIATED:
                return defaultAssociated();
        }
        return defaultName();
    }
}
