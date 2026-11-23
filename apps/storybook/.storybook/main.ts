import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  framework: "@storybook/react-vite",
  addons: [],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, { plugins: [tailwindcss()] });
  },
};

export default config;
