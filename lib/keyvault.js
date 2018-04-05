const msRestAzure = require('ms-rest-azure')
const KeyVault = require('azure-keyvault')

function getKeyVaultClient (options) {
  options = options || {}
  return Promise.resolve()
    .then(() => {
      if (options.msiEndpoint) {
        console.log('getting auth via MSI')
        return msRestAzure.loginWithAppServiceMSI({resource: 'https://vault.azure.net'})
      } else if (options.clientId && options.clientSecret && options.tenantId) {
        console.log('getting auth via principal')
        return msRestAzure.loginWithServicePrincipalSecret(options.clientId, options.clientSecret, options.tenantId)
      } else {
        return Promise.reject(new Error('Neither MSI endpoint nor Service Principal credentials provided'))
      }
    })
    .then(credentials => new KeyVault.KeyVaultClient(credentials))
}

module.exports = {
  getKeyVaultClient
}
