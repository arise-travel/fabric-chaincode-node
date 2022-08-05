/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const jsrsa = require('jsrsasign');
const KEYUTIL = jsrsa.KEYUTIL;
const ECDSA = jsrsa.ECDSA;

/**
 * @class
 */
module.exports = class ECDSA_KEY {
    /**
	 * this class represents the private or public key of an ECDSA key pair.
	 *
	 * @param {object} key This must be the "privKeyObj" or "pubKeyObj" part
	 *        of the object generated by jsrsasign.KEYUTIL.generateKeypair()
	 */
    constructor(key) {
        if (typeof key === 'undefined' || key === null) {
            throw new Error('The key parameter is required by this key class implementation, whether this instance is for the public key or private key');
        }

        if (!key.type || key.type !== 'EC') {
            throw new Error('This key implementation only supports keys generated by jsrsasign.KEYUTIL. It must have a "type" property of value "EC"');
        }

        // prvKeyHex value can be null for public keys, so need to check typeof here
        if (typeof key.prvKeyHex === 'undefined') {
            throw new Error('This key implementation only supports keys generated by jsrsasign.KEYUTIL. It must have a "prvKeyHex" property');
        }

        // pubKeyHex must have a non-null value
        if (!key.pubKeyHex) {
            throw new Error('This key implementation only supports keys generated by jsrsasign.KEYUTIL. It must have a "pubKeyHex" property');
        }

        this._key = key;
    }

    isPrivate() {
        if (typeof this._key.prvKeyHex !== 'undefined' && this._key.prvKeyHex === null) {
            return false;
        } else {
            return true;
        }
    }

    getPublicKey() {
        if (this._key.isPublic) {
            return this;
        } else {
            const f = new ECDSA({curve: this._key.curveName});
            f.setPublicKeyHex(this._key.pubKeyHex);
            f.isPrivate = false;
            f.isPublic = true;
            return new ECDSA_KEY(f);
        }
    }

    toBytes() {
        // this is specific to the private key format generated by
        // npm module 'jsrsasign.KEYUTIL'
        if (this.isPrivate()) {
            return KEYUTIL.getPEM(this._key, 'PKCS8PRV');
        } else {
            return KEYUTIL.getPEM(this._key);
        }
    }
};
