/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Logger = require('../logger');
const logger = Logger.getLogger('./lib/annotations/object.js');
const utils = require('./utils');
require('reflect-metadata');

const getProto = function (prototype) {
    return Object.getPrototypeOf(prototype);
};

module.exports.Object = function Object (opts) {
    return (target) => {
        logger.info('@Object args: Target -> %s', target.constructor.name);

        const objects = Reflect.getMetadata('fabric:objects', global) || {};

        logger.debug('Existing fabric:objects %s', objects);

        const properties = Reflect.getMetadata('fabric:object-properties', target.prototype) || {};

        logger.debug('Existing fabric:object-properties for target', properties);

        // check for the presence of a supertype
        const supertype = getProto(target.prototype).constructor.name;

        if (supertype === 'Object') {
            objects[target.name] = {
                '$id': target.name,
                type: 'object',
                cnstr: target,
                properties: properties
            };

            // add in the discriminator property name if one has been supplied in the object annotations
            if (opts && opts.discriminator) {
                objects[target.name].discriminator = {propertyName: opts.discriminator};
            }
        } else {
            objects[target.name] = {
                '$id': target.name,
                cnstr: target,
                allOf: [
                    {
                        type: 'object',
                        properties: properties
                    },
                    {
                        '$ref': `${supertype}`
                    }
                ]
            };
        }

        Reflect.defineMetadata('fabric:objects', objects, global);

        logger.debug('Updated fabric:objects', objects);
    };
};

module.exports.Property = function Property (name, type) {
    return (target, propertyKey) => {
        logger.debug('@Property args:', `Property Key -> ${propertyKey}, Name -> ${name}, Type -> ${type},`, 'Target ->', target.constructor.name);

        const properties = Reflect.getOwnMetadata('fabric:object-properties', target) || {};

        logger.debug('Existing fabric:object-properties for target', properties);

        if (!name || !type) {
            name = propertyKey;

            const metaType = Reflect.getMetadata('design:type', target, propertyKey);
            type = typeof metaType === 'function' ? metaType.name : metaType.toString();
        }

        properties[name] = utils.generateSchema(type, false);

        Reflect.defineMetadata('fabric:object-properties', properties, target);

        logger.debug('Updated fabric:object-properties for target', properties);
    };
};
