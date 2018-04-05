import test from 'ava'
import {SecretStore} from './secret-store'

test('require KeyVault URL in constructor', t => {
  t.throws(() => new SecretStore())
  t.notThrows(() => new SecretStore('https://url'))
})

test('return instance when provided with valid KeyVault url', t => {
  const s = new SecretStore('https://myvault')
  t.is(s.constructor, SecretStore)
})
test('getName() returns correct object', t => {
  const s = new SecretStore('https://myvault')
  s.add('a')
  s.add('b')
  s.add('c')
  const v = s.getSecret('b')
  t.is(v.name, 'b')
  t.falsy(s.getSecret('notHere'), 'non existant lookup returns falsy value')
})
test('age() return age of oldest entry', t => {
  const s = new SecretStore('https://myvault')
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
  const s = new SecretStore('https://myvault')
  s.add('a')
  s.add('b')
  const fakeVault = {
    getSecret: (url, name) => Promise.resolve({value: `${name}-fancyValue`})
  }
  await s.refresh(fakeVault)
  t.is(s.getSecret('a').value, 'a-fancyValue', 'secret value is updated')
})
test('refresh() should throw without keyVaultClient', async t => {
  const s = new SecretStore('https://myvault')
  s.add('a')
  s.add('b')
  t.throws(() => s.refresh(), 'invalid keyVaultClient')
})
test('refresh() should not execute concurrent updates', async t => {
  const s = new SecretStore('https://myvault')
  s.add('a')
  s.add('b')
  let callCount = 0
  const fakeVault = {
    getSecret: (url, name) => Promise.resolve({value: `${name}-${callCount++}`})
  }
  await Promise.all([s.refresh(fakeVault), s.refresh(fakeVault), s.refresh(fakeVault)])
  t.is(s.getSecret('a').value, 'a-0', 'returns initial callCount after multiple refresh() calls')
})
