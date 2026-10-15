const defaults = require('../config/analytics.json');
function analyticsConfig(env = process.env) {
  const config = {...defaults,
    ga4MeasurementId:env.GA4_MEASUREMENT_ID ?? defaults.ga4MeasurementId,
    clarityProjectId:env.CLARITY_PROJECT_ID ?? defaults.clarityProjectId};
  if (config.ga4MeasurementId && !/^G-[A-Z0-9]+$/.test(config.ga4MeasurementId)) throw new Error('Invalid GA4 measurement ID');
  if (config.clarityProjectId && !/^[a-z0-9]+$/i.test(config.clarityProjectId)) throw new Error('Invalid Clarity project ID');
  config.enabled = Boolean(config.ga4MeasurementId || config.clarityProjectId);
  return config;
}
function analyticsMarkup(config) {
  if (!config.enabled) return '';
  const json = JSON.stringify(config).replace(/</g,'\\u003c');
  return `<script type="application/json" id="analytics-config">${json}</script><script src="/analytics.js" defer></script>`;
}
module.exports = {analyticsConfig, analyticsMarkup};
