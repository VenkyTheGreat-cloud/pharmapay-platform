const fs = require('fs');
const path = require('path');

const TENANT_CONFIGS_DIR = path.join(__dirname, '..', '..', '..', 'tenant-configs');

function getTenantConfig(slug) {
  const filePath = path.join(TENANT_CONFIGS_DIR, `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function resolveTenant(req, res, next) {
  const hostname = req.hostname || '';
  const slug = hostname.split('.')[0];

  if (!slug) {
    return res.status(404).json({ error: 'Unknown tenant' });
  }

  const config = getTenantConfig(slug);

  if (!config) {
    return res.status(404).json({ error: 'Unknown tenant' });
  }

  req.tenant = config;
  next();
}

module.exports = { getTenantConfig, resolveTenant };
