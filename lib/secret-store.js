class SecretStore {
  constructor (keyVaultUrl) {
    if (!keyVaultUrl) {
      throw new Error('Please specify a keyVaultUrl to use for updating the SecretStore')
    }
    this.secrets = []
    this.keyVaultUrl = keyVaultUrl
    this.isUpdating = false
    this._updatePromise = null
  }

  // pass in the response from an Array<KeyVaultClient.getSecret> to update local secrets
  _updateFromKeyVaultResponse (kvSecrets) {
    console.log('Updating SecretStore from response')
    kvSecrets.forEach(kvS => {
      const secret = this.getSecret(kvS['_key'])
      secret.value = kvS.value
      secret.updated = new Date()
    })
    return this
  }

  // return time in seconds since oldest secret was updated
  age () {
    const ages = this.secrets.map(e => (new Date() - new Date(e.updated)) / 1000)
    const min = Math.min(...ages)
    return isNaN(min) ? Infinity : min
  }

  // get a secret by name
  getSecret (name) {
    return this.secrets.find(e => e.name.toLowerCase() === name.toLowerCase())
  }

  // update (all) the secrets in the store
  update (keyVaultClient) {
    // prevent update process from triggering multiple times concurrently
    if (!this.isUpdating) {
      this.isUpdating = true
      console.log('triggering update!', this.isUpdating)
      this._updatePromise = Promise.all(this.map(s => {
        return keyVaultClient.getSecret(this.keyVaultUrl, s.name, '')
          .then(res => Object.assign(res, {_key: s.name}))
      }))
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
  }
}

module.exports = {
  SecretStore
}
