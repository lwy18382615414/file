import type { ThemeTokens } from "./tokens";

export const applyTheme = (theme: ThemeTokens) => {
  const root = document.documentElement;

  root.style.setProperty("--theme-name", "default-light");

  root.style.setProperty("--list-bg-color", "#f3f4f6");
  root.style.setProperty("--content-bg-color", "#f3f4f6");
  root.style.setProperty("--subtle-fill-color", "#ebeff6");
  root.style.setProperty("--dialog-divider-color", "rgba(227, 230, 236, 0.5)");
  root.style.setProperty("--page-bg", "var(--content-bg-color)");
  root.style.setProperty("--panel-bg", "var(--card-bg-color)");
  root.style.setProperty("--mask-bg", "rgba(0, 0, 0, 0.45)");

  root.style.setProperty("--text-primary-color", theme.textPrimaryColor);
  root.style.setProperty("--text-secondary-color", theme.textSecondaryColor);
  root.style.setProperty("--text-weak-color", theme.textWeakColor);
  root.style.setProperty("--text-color", "var(--text-primary-color)");
  root.style.setProperty(
    "--text-color-secondary",
    "var(--text-secondary-color)",
  );
  root.style.setProperty("--text-color-placeholder", "var(--text-weak-color)");

  root.style.setProperty("--theme-color", theme.themeColor);
  root.style.setProperty("--theme-color-hover", theme.themeColorHover);
  root.style.setProperty("--theme-color-active", theme.themeColorActive);
  root.style.setProperty("--theme-color-light", theme.themeColorLight);
  root.style.setProperty("--primary-color", "var(--theme-color)");
  root.style.setProperty("--primary-color-hover", "var(--theme-color-hover)");
  root.style.setProperty("--primary-color-active", "var(--theme-color-active)");
  root.style.setProperty("--link-color", "var(--theme-color)");
  root.style.setProperty("--link-hover-color", "var(--theme-color-hover)");
  root.style.setProperty("--tag-primary-bg", "var(--theme-color-light)");
  root.style.setProperty("--tag-primary-color", "var(--theme-color)");

  root.style.setProperty("--btn-primary-color", theme.btnPrimaryColor);
  root.style.setProperty("--btn-primary-text-color", "#ffffff");
  root.style.setProperty("--btn-default-bg", "#ffffff");
  root.style.setProperty(
    "--btn-default-text-color",
    "var(--text-primary-color)",
  );
  root.style.setProperty(
    "--btn-secondary-border-color",
    theme.btnSecondaryBorderColor,
  );
  root.style.setProperty(
    "--btn-default-border-color",
    "var(--btn-secondary-border-color)",
  );

  root.style.setProperty("--warning-red-color", theme.warningRedColor);
  root.style.setProperty("--warning-green-color", theme.warningGreenColor);
  root.style.setProperty("--warning-blue-color", theme.warningBlueColor);
  root.style.setProperty("--warning-red-bg", "#fef2f2");
  root.style.setProperty("--warning-green-bg", "#ecfdf3");
  root.style.setProperty("--warning-blue-bg", "#eff6ff");
  root.style.setProperty("--success-color", "var(--warning-green-color)");
  root.style.setProperty("--error-color", "var(--warning-red-color)");
  root.style.setProperty("--info-color", "var(--warning-blue-color)");

  root.style.setProperty("--card-bg-color", theme.cardBgColor);
  root.style.setProperty("--divider-color", theme.dividerColor);
  root.style.setProperty("--card-border-color", theme.cardBorderColor);
  root.style.setProperty("--border-color", theme.dividerColor);
  root.style.setProperty("--icon-bg-color", theme.iconBackgroundColor);

  root.style.setProperty("--radius-xs", "4px");
  root.style.setProperty("--radius-sm", "6px");
  root.style.setProperty("--radius-md", "8px");
  root.style.setProperty("--radius-lg", "12px");

  root.style.setProperty("--input-bg-color", "#ffffff");
  root.style.setProperty("--input-border-color", "var(--border-color)");
  root.style.setProperty("--input-border-hover-color", "#d5dbe5");
  root.style.setProperty("--input-border-focus-color", "var(--primary-color)");
  root.style.setProperty("--input-placeholder-color", "var(--text-weak-color)");

  root.style.setProperty("--table-header-bg", "#f8f9fb");
  root.style.setProperty("--table-row-hover-bg", "#f7f8fc");

  root.style.setProperty("--el-color-primary", "var(--theme-color)");
  root.style.setProperty(
    "--el-color-primary-light-3",
    "var(--theme-color-hover)",
  );
  root.style.setProperty(
    "--el-color-primary-light-5",
    "var(--theme-color-light)",
  );
  root.style.setProperty(
    "--el-color-primary-light-7",
    "var(--theme-color-light)",
  );
  root.style.setProperty(
    "--el-color-primary-light-8",
    "var(--theme-color-light)",
  );
  root.style.setProperty(
    "--el-color-primary-light-9",
    "var(--theme-color-light)",
  );
  root.style.setProperty(
    "--el-color-primary-dark-2",
    "var(--theme-color-active)",
  );
  root.style.setProperty("--el-color-success", "var(--warning-green-color)");
  root.style.setProperty("--el-color-warning", "var(--warning-blue-color)");
  root.style.setProperty("--el-color-danger", "var(--warning-red-color)");
  root.style.setProperty("--el-color-error", "var(--warning-red-color)");
  root.style.setProperty("--el-color-info", "var(--text-secondary-color)");
  root.style.setProperty(
    "--el-text-color-primary",
    "var(--text-primary-color)",
  );
  root.style.setProperty(
    "--el-text-color-regular",
    "var(--text-primary-color)",
  );
  root.style.setProperty(
    "--el-text-color-secondary",
    "var(--text-secondary-color)",
  );
  root.style.setProperty(
    "--el-text-color-placeholder",
    "var(--text-weak-color)",
  );
  root.style.setProperty("--el-border-color", "var(--card-border-color)");
  root.style.setProperty("--el-border-color-light", "var(--divider-color)");
  root.style.setProperty("--el-fill-color-light", "var(--content-bg-color)");
  root.style.setProperty("--el-bg-color", "var(--btn-default-bg)");
  root.style.setProperty("--el-bg-color-page", "var(--content-bg-color)");
  root.style.setProperty("--el-bg-color-overlay", "var(--btn-default-bg)");
  root.style.setProperty("--el-dialog-bg-color", "var(--btn-default-bg)");
  root.style.setProperty("--el-mask-color", "var(--mask-bg)");
  root.style.setProperty("--el-input-bg-color", "var(--input-bg-color)");
  root.style.setProperty(
    "--el-input-border-color",
    "var(--input-border-color)",
  );
  root.style.setProperty(
    "--el-input-hover-border-color",
    "var(--input-border-hover-color)",
  );
  root.style.setProperty(
    "--el-input-focus-border-color",
    "var(--input-border-focus-color)",
  );
  root.style.setProperty(
    "--el-table-header-bg-color",
    "var(--table-header-bg)",
  );
  root.style.setProperty(
    "--el-table-header-text-color",
    "var(--text-secondary-color)",
  );
  root.style.setProperty(
    "--el-table-row-hover-bg-color",
    "var(--table-row-hover-bg)",
  );
  root.style.setProperty("--el-table-border-color", "var(--divider-color)");

  root.style.setProperty("--van-primary-color", "var(--theme-color)");
  root.style.setProperty("--van-success-color", "var(--warning-green-color)");
  root.style.setProperty("--van-warning-color", "var(--warning-blue-color)");
  root.style.setProperty("--van-danger-color", "var(--warning-red-color)");
  root.style.setProperty("--van-text-color", "var(--text-primary-color)");
  root.style.setProperty("--van-text-color-2", "var(--text-secondary-color)");
  root.style.setProperty("--van-text-color-3", "var(--text-weak-color)");
  root.style.setProperty("--van-border-color", "var(--divider-color)");
  root.style.setProperty("--van-background", "var(--btn-default-bg)");
  // root.style.setProperty("--van-background-2", "var(--content-bg-color)");
  root.style.setProperty("--van-active-color", "var(--theme-color-light)");
  root.style.setProperty(
    "--van-button-primary-background",
    "var(--btn-primary-color)",
  );
  root.style.setProperty(
    "--van-button-primary-border-color",
    "var(--btn-primary-color)",
  );
  root.style.setProperty(
    "--van-button-primary-color",
    "var(--btn-primary-text-color)",
  );
  root.style.setProperty("--van-popup-background", "var(--btn-default-bg)");
  root.style.setProperty("--van-dialog-background", "var(--btn-default-bg)");
  root.style.setProperty(
    "--van-field-input-text-color",
    "var(--text-primary-color)",
  );
  root.style.setProperty(
    "--van-field-placeholder-text-color",
    "var(--text-weak-color)",
  );
};
