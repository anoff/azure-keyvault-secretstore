import test from 'ava'
import * as td from 'testdouble'

td.replace('ms-rest-azure')
td.replace('azure-keyvault')
const { getKeyVaultClient } = require('./keyvault')

test('getKeyVaultClient() requires connections options', async t => {
  await t.notThrows(() => getKeyVaultClient({msiEndpoint: 'weee'}))
  await t.notThrows(() => getKeyVaultClient({clientId: 'wee', clientSecret: 'waaa', tenantId: 'wohoo'}))
  await t.throws(getKeyVaultClient())
})
