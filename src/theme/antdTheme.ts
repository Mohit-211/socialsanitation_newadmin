// antd theme built from the design tokens in src/index.css.
//
// index.css is the single source of truth. This module reads the CSS custom
// properties at startup and maps them onto antd's tokens, so antd components
// use exactly the same palette, font and radii as the rest of the app.
// The brand colors are light, which is why several components get dark
// "on-primary" text or the "-strong" shades below: that keeps every state
// readable (WCAG AA) while the fills stay on-brand.

// Fallbacks mirror index.css and are only used if the stylesheet has not
// loaded (for example in a unit test without CSS).
const FALLBACKS = {
  "--color-primary": "#78e8f7",
  "--color-primary-hover": "#a6f8ff",
  "--color-primary-active": "#5cc0d1",
  "--color-primary-border": "#4398ab",
  "--color-primary-strong": "#2d7285",
  "--color-primary-stronger": "#1f4f5e",
  "--color-primary-soft": "#cffdff",
  "--color-primary-subtle": "#f0fffe",
  "--color-on-primary": "#0b1f24",
  "--color-secondary": "#08f621",
  "--color-ink": "#0b1f24",
  "--color-ink-soft": "#133038",
  "--color-ink-deep": "#071417",
  "--color-text": "#111827",
  "--color-text-secondary": "#4b5563",
  "--color-text-muted": "#6b7280",
  "--color-text-subtle": "#9ca3af",
  "--color-text-inverse": "#ffffff",
  "--color-bg": "#ffffff",
  "--color-bg-subtle": "#f9fafb",
  "--color-bg-muted": "#f3f4f6",
  "--color-bg-layout": "#f4f7f8",
  "--color-border": "#e5e7eb",
  "--color-border-subtle": "#f0f1f3",
  "--color-border-strong": "#d1d5db",
  "--color-success": "#00a81c",
  "--color-success-strong": "#00821a",
  "--color-warning": "#f59e0b",
  "--color-warning-strong": "#b45309",
  "--color-error": "#dc2626",
  "--color-error-strong": "#b91c1c",
  "--font-sans":
    '"Roboto Variable", Roboto, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  "--font-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  "--radius-xs": "4px",
  "--radius-sm": "6px",
  "--radius-md": "8px",
  "--radius-lg": "12px",
  "--focus-ring": "0 0 0 3px rgba(120, 232, 247, 0.45)",
};

/**
 * Reads a design token from index.css, e.g. cssVar("--color-primary").
 * Use it wherever a real color value is required instead of a CSS
 * variable: Google Maps markers, canvas drawing, Excel exports, etc.
 */
export function cssVar(name: string): string {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    if (value) return value;
  }
  return (FALLBACKS as Record<string, string>)[name] ?? "";
}

const px = (value: string) => Number.parseFloat(value) || 0;

export function buildAntdTheme() {
  const t = cssVar;

  const primary = t("--color-primary");
  const primaryHover = t("--color-primary-hover");
  const primaryActive = t("--color-primary-active");
  const primaryBorder = t("--color-primary-border");
  const primaryStrong = t("--color-primary-strong");
  const primaryStronger = t("--color-primary-stronger");
  const primarySoft = t("--color-primary-soft");
  const primarySubtle = t("--color-primary-subtle");
  const onPrimary = t("--color-on-primary");
  const ink = t("--color-ink");
  const inkSoft = t("--color-ink-soft");
  const inkDeep = t("--color-ink-deep");
  const text = t("--color-text");
  const bg = t("--color-bg");
  const bgSubtle = t("--color-bg-subtle");
  const border = t("--color-border");
  const borderSubtle = t("--color-border-subtle");
  const focusRing = t("--focus-ring");
  const successStrong = t("--color-success-strong");
  const warningStrong = t("--color-warning-strong");
  const errorStrong = t("--color-error-strong");

  const inputFocus = {
    activeBorderColor: primaryBorder,
    hoverBorderColor: primaryActive,
    activeShadow: focusRing,
  };

  return {
    token: {
      colorPrimary: primary,
      colorInfo: primaryStrong,
      colorSuccess: t("--color-success"),
      colorWarning: t("--color-warning"),
      colorError: t("--color-error"),
      colorLink: primaryStrong,
      colorLinkHover: primaryStronger,
      colorLinkActive: primaryStronger,
      colorPrimaryText: primaryStrong,
      colorPrimaryTextHover: primaryBorder,
      colorPrimaryTextActive: primaryStronger,
      colorTextBase: text,
      colorText: text,
      colorTextSecondary: t("--color-text-secondary"),
      colorTextTertiary: t("--color-text-muted"),
      colorTextQuaternary: t("--color-text-subtle"),
      colorTextPlaceholder: t("--color-text-subtle"),
      colorBorder: t("--color-border-strong"),
      colorBorderSecondary: border,
      colorSplit: borderSubtle,
      colorBgLayout: t("--color-bg-layout"),
      colorBgContainer: bg,
      colorFillAlter: bgSubtle,
      controlItemBgActive: primarySoft,
      controlItemBgActiveHover: primaryHover,
      controlOutline: "rgba(120, 232, 247, 0.45)",
      fontFamily: t("--font-sans"),
      fontFamilyCode: t("--font-mono"),
      fontSize: 14,
      borderRadius: px(t("--radius-md")),
      borderRadiusLG: px(t("--radius-lg")),
      borderRadiusSM: px(t("--radius-sm")),
      borderRadiusXS: px(t("--radius-xs")),
    },
    components: {
      Button: {
        primaryColor: onPrimary,
        primaryShadow: "none",
        defaultShadow: "none",
        dangerShadow: "none",
        fontWeight: 500,
        // Outlined buttons darken on hover instead of turning light cyan.
        defaultHoverColor: primaryStrong,
        defaultHoverBorderColor: primaryBorder,
        defaultActiveColor: primaryStronger,
        defaultActiveBorderColor: primaryStrong,
      },
      // Status text (tags, typography, form hints) uses the darker shades so
      // it stays readable on white and on the light status fills.
      Tag: {
        defaultBg: bgSubtle,
        defaultColor: t("--color-text-secondary"),
        colorSuccess: successStrong,
        colorWarning: warningStrong,
        colorError: errorStrong,
      },
      Typography: {
        colorSuccess: successStrong,
        colorWarning: warningStrong,
      },
      // Default avatars: soft brand fill with dark initials (was white on gray).
      Avatar: {
        colorTextPlaceholder: primarySoft,
        colorTextLightSolid: onPrimary,
      },
      Form: {
        colorWarning: warningStrong,
      },
      Layout: {
        siderBg: ink,
        headerBg: bg,
        bodyBg: t("--color-bg-layout"),
        triggerBg: inkSoft,
        triggerColor: t("--color-text-inverse"),
      },
      Menu: {
        darkItemBg: ink,
        darkSubMenuItemBg: inkDeep,
        darkPopupBg: ink,
        darkItemColor: "rgba(255, 255, 255, 0.72)",
        darkItemHoverColor: t("--color-text-inverse"),
        darkItemHoverBg: "rgba(120, 232, 247, 0.12)",
        darkItemSelectedBg: primary,
        darkItemSelectedColor: onPrimary,
        darkGroupTitleColor: "rgba(255, 255, 255, 0.45)",
        itemSelectedColor: primaryStronger,
        itemSelectedBg: primarySoft,
        itemHoverColor: primaryStrong,
      },
      Tabs: {
        itemSelectedColor: primaryStrong,
        itemHoverColor: primaryStrong,
        itemActiveColor: primaryStronger,
        inkBarColor: primaryBorder,
      },
      Pagination: {
        itemActiveBg: primarySoft,
        itemActiveColor: primaryStronger,
        itemActiveColorHover: primaryStronger,
        colorPrimary: primaryBorder,
        colorPrimaryHover: primaryStrong,
      },
      // Check marks and step numbers sit on the light primary fill.
      Checkbox: { colorWhite: onPrimary },
      Steps: { colorTextLightSolid: onPrimary },
      DatePicker: {
        ...inputFocus,
        colorTextLightSolid: onPrimary,
        cellActiveWithRangeBg: primarySubtle,
      },
      Calendar: { colorTextLightSolid: onPrimary },
      Radio: {
        colorPrimary: primaryBorder,
        buttonSolidCheckedBg: primary,
        buttonSolidCheckedHoverBg: primaryHover,
        buttonSolidCheckedActiveBg: primaryActive,
        buttonSolidCheckedColor: onPrimary,
      },
      // Light fills are hard to read as an "on" state, so toggles, spinners
      // and progress use the stronger shades.
      Switch: { colorPrimary: primaryBorder, colorPrimaryHover: primaryStrong },
      Spin: { colorPrimary: primaryBorder },
      Progress: { defaultColor: primaryBorder },
      Slider: {
        handleColor: primaryBorder,
        handleActiveColor: primaryStrong,
        trackBg: primary,
        trackHoverBg: primaryActive,
        dotActiveBorderColor: primaryBorder,
      },
      Input: inputFocus,
      InputNumber: inputFocus,
      Mentions: inputFocus,
      Select: {
        activeBorderColor: primaryBorder,
        hoverBorderColor: primaryActive,
        activeOutlineColor: "rgba(120, 232, 247, 0.45)",
        optionSelectedBg: primarySoft,
        optionSelectedColor: text,
      },
      Cascader: { optionSelectedBg: primarySoft },
      TreeSelect: { nodeSelectedBg: primarySoft },
      Table: {
        headerBg: bg,
        headerColor: text,
        rowHoverBg: bgSubtle,
        rowSelectedBg: primarySubtle,
        rowSelectedHoverBg: primarySoft,
        borderColor: borderSubtle,
        headerSplitColor: "transparent",
      },
    },
  };
}
