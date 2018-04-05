const keyVault = require('./lib/keyvault')
const secretStore = require('./lib/secret-store')

// read ENV variables for authentication
const clientId = process.env['ARM_CLIENT_ID']
const clientSecret = process.env['ARM_CLIENT_SECRET']
const tenantId = process.env['ARM_TENANT_ID']
const msiEndpoint = process.env['MSI_ENDPOINT']

//
const keyVaultCurried = () => keyVault.getKeyVaultClient({clientId, clientSecret, tenantId, msiEndpoint})

module.exports = {
  SecretStore: secretStore.SecretStore,
  getKeyVaultClient: keyVault.getKeyVaultClient,
  createKeyVaultClient: keyVaultCurried
}
