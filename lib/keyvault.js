const msRestAzure = require('ms-rest-azure')
const KeyVault = require('azure-keyvault')

const clientId = process.env['ARM_CLIENT_ID']
const clientSecret = process.env['ARM_CLIENT_SECRET']
const tenantId = process.env['ARM_TENANT_ID']

function getKeyVaultClient () {
  return Promise.resolve()
    .then(() => {
      if (process.env.MSI_ENDPOINT) {
        console.log('getting auth via MSI')
        return msRestAzure.loginWithAppServiceMSI({resource: 'https://vault.azure.net'})
      } else if (clientId && clientSecret && tenantId) {
        console.log('getting auth via principal')
        return msRestAzure.loginWithServicePrincipalSecret(clientId, clientSecret, tenantId)
      } else {
        throw new Error('Neither MSI endpoint nor Service Principal credentials provided via ENV')
      }
    })
    .then(credentials => new KeyVault.KeyVaultClient(credentials))
}

module.exports = {
  getKeyVaultClient
}
