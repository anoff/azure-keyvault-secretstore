class SecretStore {
  constructor (keyVaultUrl, createKeyVaultClientFn) {
    if (!keyVaultUrl) {
      throw new Error('Please specify a keyVaultUrl to use for updating the SecretStore')
    }
    if (!createKeyVaultClientFn || typeof createKeyVaultClientFn !== 'function') {
      throw new Error('second argument should be a function returning/resolving to a valid KeyVaultClient')
    }
    this.secrets = []
    this.keyVaultUrl = keyVaultUrl
    this._createKeyVaultClientFn = createKeyVaultClientFn
    this.isUpdating = false
    this._updatePromise = null
  }

  // pass in the response from an Array<KeyVaultClient.getSecret> to update local secrets
  _updateFromKeyVaultResponse (kvSecrets) {
    this.secrets = this.secrets.map(e => {
      const vaultEntry = kvSecrets.find(kvs => kvs._key.toLowerCase() === e.name.toLowerCase())
      if (vaultEntry) {
        e.value = vaultEntry.value
        e.updated = new Date()
      }
      return e
    })
    return this
  }

  // return time in seconds since oldest secret was updated
  age () {
    const ages = this.secrets.map(e => (new Date() - new Date(e.updated)) / 1000)
    const min = Math.min(...ages)
    return min
  }

  // get a secret by name
  get (name) {
    return this.secrets.find(e => e.name.toLowerCase() === name.toLowerCase())
  }

  // refresh (all) the secrets in the store
  refresh () {
    // prevent update process from triggering multiple times concurrently
    if (!this.isUpdating) {
      this.isUpdating = true
      let keyVaultClientTmp = this._createKeyVaultClientFn()
      // wrap into promise to make it a standard interface for following code
      if (!(keyVaultClientTmp instanceof Promise)) {
        keyVaultClientTmp = Promise.resolve(keyVaultClientTmp)
      }
      this._updatePromise = keyVaultClientTmp
        .then(keyVaultClient => Promise.all(this.secrets.map(s => {
          return keyVaultClient.getSecret(this.keyVaultUrl, s.name, '')
            .then(res => Object.assign(res, { _key: s.name }))
        })))
        .then(this._updateFromKeyVaultResponse.bind(this))
        .then(() => {
          this.isUpdating = false
          this._updatePromise = null
          // resolve the promise with an updated secret store
          return this
        })
    }
    return this._updatePromise
  }

  // add a secret to the store using the secrets name (same in KeyVault)
  add (name) {
    const s = {
      name,
      updated: new Date(0),
      value: null
    }
    this.secrets.push(s)
    return this
  }
}

module.exports = {
  SecretStore
}
