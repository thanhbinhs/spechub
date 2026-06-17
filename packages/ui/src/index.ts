export const uiTokens = {
  radius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
  },
  shell: {
    headerHeight: "4rem",
    contentMaxWidth: "80rem",
  },
  state: {
    focusRing: "0 0 0 3px rgb(37 99 235 / 0.25)",
  },
} as const;

export type UiTokens = typeof uiTokens;
