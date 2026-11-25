// Loaded only by Next in the final framework phase, never by LIGHT checks.
/** @satisfies {{plugins: {"@tailwindcss/postcss": import("@tailwindcss/postcss").PluginOptions}}} */
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
