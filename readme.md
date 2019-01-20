# azure-keyvault-secretstore

[![npm version](https://img.shields.io/npm/v/azure-keyvault-secretstore.svg)](https://www.npmjs.com/package/azure-keyvault-secretstore)
[![Build Status](https://travis-ci.org/anoff/azure-keyvault-secretstore.svg?branch=master)](https://travis-ci.org/anoff/azure-keyvault-secretstore)
[![Coverage Status](https://coveralls.io/repos/github/anoff/azure-keyvault-secretstore/badge.svg?branch=master)](https://coveralls.io/github/anoff/azure-keyvault-secretstore?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/anoff/azure-keyvault-secretstore.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/npm/azure-keyvault-secretstore/badge.svg)](https://snyk.io/test/npm/azure-keyvault-secretstore)
[![Outdated dependencies](https://david-dm.org/anoff/azure-keyvault-secretstore.svg)](https://david-dm.org/anoff/azure-keyvault-secretstore)

> Storing secrets in KeyVault 🔐 and using them in Azure Function ⚡️ without writing boilerplate each time

<!-- TOC depthFrom:2 depthTo:4 -->

- [Install](#install)
- [Usage](#usage)
- [API](#api)
  - [SecretStore](#secretstore)
    - [SecretStore.secrets](#secretstoresecrets)
    - [SecretStore.isUpdating](#secretstoreisupdating)
    - [new SecretStore(keyVaultUrl, createKeyVaultClientFn)](#new-secretstorekeyvaulturl-createkeyvaultclientfn)
    - [secretStore.add(secretName)](#secretstoreaddsecretname)
    - [secretStore.age()](#secretstoreage)
    - [secretStore.refresh()](#secretstorerefresh)
    - [secretStore.get(secretName)](#secretstoregetsecretname)
  - [getKeyVaultClient(options)](#getkeyvaultclientoptions)
    - [options.clientId](#optionsclientid)
    - [options.clientSecret](#optionsclientsecret)
    - [options.tenantId](#optionstenantid)
    - [options.msiEndpoint](#optionsmsiendpoint)
  - [createKeyVaultClient()](#createkeyvaultclient)
- [License](#license)

<!-- /TOC -->

## Install

First get the module installed in your Function App by adding it to your `package.json`

```sh
npm install azure-keyvault-secretstore
```

## Usage

Quick example how to use this in a Function App with MSI enabled:

```javascript
const { SecretStore, createKeyVaultClient } = require('azure-keyvault-secretstore')

const secretStore = new SecretStore('https://customvault123.vault.azure.net', createKeyVaultClient)
secretStore.add('secret-one').add('another-secret').add('same-name-as-in-keyvault')
secretStore.refresh() // initial refresh
.then(/* ... bootstrap databases etc using the secrets using secretStore.get('secret-one').value */)
module.exports = (context, req) => {
  if (secretStore.age() > 60*60) secretStore.refresh() // update secrets (async) once per hour - depending on function call frequency
  console.log(`secret-one has a value of "${secretStore.get('secret-one').value}" and was last updated ${Date.now() - secretStore.get('secret-one').updated} seconds ago`)
}
```

## API

The module returns an object containing multiple functions. The functions are specified below.

All methods are _promise-friendly_

### SecretStore

#### SecretStore.secrets

Type: `Array`

Exposes the internal array of all secrets.

#### SecretStore.isUpdating

Type: `Boolean`

Is true if there is a `refresh()` in progress.

#### new SecretStore(keyVaultUrl, createKeyVaultClientFn)

Create a new SecretStore instance. Specify the URL endpoint of the KeyVault and a function that will (eventually) return a valid **azure-keyvault** client. See below for ways to get a client.

##### keyVaultUrl

Type: `string`

URL endpoint of an Azure KeyVault e.g. https://myvault.vault.azure.net

##### createKeyVaultClientFn

Type: `function`

A function that will either return a valid client or a Promise that resolves to one.

#### secretStore.add(secretName)

Add a secret to the store that should be fetched from the KeyVault. Returns the instance itself so the method can be chained.

##### secretName

Type: `string`

Same name that the secret has in the vault.

#### secretStore.age()

Returns the number of seconds since the store has been refreshed.

#### secretStore.refresh()

Fetch the current values for all secrets added to the store from KeyVault. Returns a Promise resolving to the updated `SecretStore` instance.

This method will `Promise.reject` if any of the added secrets can not be fetched from KeyVault. The resulting error message is a transparent message from the **azure-keyvault** library:

```javascript
{
  "statusCode": 404,
  "request": {...},
  "response": {...},
  "code": "SecretNotFound",
  "body": {
    "error": {
      "code": "SecretNotFound",
      "message": "Secret not found: another-secret"
    }
  }
}
```

#### secretStore.get(secretName)

Fetch the contents of a specific secret.

##### secretName

Type: `string`

Same name as previously used during `.add()`

##### return
Will return an object containing:

```javascript
{
  name: 'secretName',
  value: 'supersecret',
  updated: '2010-10-20T20:10:00.123Z'
}
```

if `refresh()` has not been called the secrets will default to

```javascript
{
  name: 'secretName',
  value: null,
  updated: '1970-01-01T00:00:00.000Z'
}
```

### getKeyVaultClient(options)

Get a valid KeyVaultClient to be used in `SecretStore` constructor. Supply authentication options via _options_ argument. Either need a valid `msiEndpoint` in case MSI is activated or Service Principal credentials.
Returns a Promise resolving to a client.

#### options.clientId

Type: `string`

Service Principal ID that has access to the KeyVault.

#### options.clientSecret

Type: `string`

Service Principal Secret that has access to the KeyVault.

#### options.tenantId

Type: `string`

Azure AD tenant where KeyVault and SP are hosted.

#### options.msiEndpoint

Type: `string`

The Managed Service Identity endpoint for your function. Usually available via `process.env.MSI_ENDPOINT` after activating MSI.

### createKeyVaultClient()

A bootstrapped version of `getKeyVaultClient()` that reads some default environment variables and uses those to create a valid client. This works off the shelf if MSI is activated, otherwise Service Principal credentials have to be exposed to the process.

```javascript
process.env['CLIENT_ID'] // -> options.clientId
process.env['CLIENT_SECRET'] // -> options.clientSecret
process.env['TENANT_ID'] // -> options.tenantId
process.env['MSI_ENDPOINT'] // -> options.msiEndpoint
```

## License

[MIT](./LICENSE) by [Andreas Offenhaeuser](https://anoff.io)
