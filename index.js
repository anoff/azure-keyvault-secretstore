const keyVault = require('./lib/keyvault')
const secretStore = require('./lib/secret-store')

// read ENV variables for authentication
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const tenantId = process.env.TENANT_ID
const msiEndpoint = process.env.MSI_ENDPOINT

// create a curried client that uses ENV variables
const keyVaultCurried = () => keyVault.getKeyVaultClient({ clientId, clientSecret, tenantId, msiEndpoint })

module.exports = {
  SecretStore: secretStore.SecretStore,
  getKeyVaultClient: keyVault.getKeyVaultClient,
  createKeyVaultClient: keyVaultCurried
}
