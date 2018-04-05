import test from 'ava'
import {SecretStore} from './secret-store'

const vaultUrl = 'https://myvault'
const keyvaultFn = () => 'fun'

test('constructor() requires KeyVault URL', t => {
  t.throws(() => new SecretStore())
  t.notThrows(() => new SecretStore(vaultUrl, keyvaultFn))
})
test('constructor() requires function to create KeyVault Client', t => {
  t.throws(() => new SecretStore(vaultUrl))
})
test('return instance when provided with valid KeyVault url', t => {
  const s = new SecretStore(vaultUrl, keyvaultFn)
  t.is(s.constructor, SecretStore)
})
test('getName() returns correct object', t => {
  const s = new SecretStore(vaultUrl, keyvaultFn)
  s.add('a').add('b').add('c')
  const v = s.getSecret('b')
  t.is(v.name, 'b')
  t.falsy(s.getSecret('notHere'), 'non existant lookup returns falsy value')
})
test('age() return age of oldest entry', t => {
  const s = new SecretStore(vaultUrl, keyvaultFn)
  s.add('a')
  s.add('b')
  s.add('c')
  t.true(s.age() > 1e9, 'non updated SecretStore should return huuuge number')
  s.secrets[0].updated = new Date('2010-01-01')
  s.secrets[1].updated = new Date()
  s.secrets[2].updated = new Date('2011-01-01')
  t.true(s.age() < 1, 'should return single digit seconds after update')
})
test('refresh() should update all secrets', async t => {
  const fakeVaultFn = () => {
    return {
      getSecret: (url, name) => Promise.resolve({value: `${name}-fancyValue`})
    }
  }
  const s = new SecretStore(vaultUrl, fakeVaultFn)
  s.add('a')
  s.add('b')
  await s.refresh()
  t.is(s.getSecret('a').value, 'a-fancyValue', 'secret value is updated')
})
test('refresh() should work if vaultClientFn returns a promise', async t => {
  const fakeVaultFn = () => Promise.resolve({
    getSecret: (url, name) => Promise.resolve({value: `${name}-fancyValue`})
  })
  const s = new SecretStore(vaultUrl, fakeVaultFn)
  s.add('a')
  s.add('b')
  await s.refresh()
  t.is(s.getSecret('a').value, 'a-fancyValue', 'secret value is updated')
})
test('refresh() should not execute concurrent updates', async t => {
  let callCount = 0
  const fakeVaultFn = () => {
    return {
      getSecret: (url, name) => Promise.resolve({value: `${name}-${callCount++}`})
    }
  }
  const s = new SecretStore(vaultUrl, fakeVaultFn)
  s.add('a')
  s.add('b')
  await Promise.all([s.refresh(), s.refresh(), s.refresh()])
  t.is(s.getSecret('a').value, 'a-0', 'returns initial callCount after multiple refresh() calls')
})
