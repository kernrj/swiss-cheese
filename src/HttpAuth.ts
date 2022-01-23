/*
 * Copyright 2018-2022 Rick Kern <kernrj@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {isSet, isString, notSet} from './util';
import crypto = require('crypto');
import random = require('./random');
import {getLogger} from './logger';

const log = getLogger('HTTP Auth');

export class HttpAuthenticator {
  private nonceCount: number = 1;
  private authInfo: any;
  private username: string;
  private password: string;
  private clientNonce: string;

  constructor() {
    this.clientNonce = random.createRandHexStringSync(16);
  }

  setCredentials(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  getUsername(): string {
    return this.username;
  }

  getPassword(): string {
    return this.password;
  }

  isValid(): boolean {
    return isSet(this.authInfo) && isSet(this.username) && isSet(this.password);
  }

  getAuthorizationHeader(method: string, uri: string, body?: string | Buffer | Uint8Array) {
    if (notSet(this.authInfo)) {
      throw new Error('Precondition failed. Call updateWwwAuthenticate() first with the value of the WWW-Authenticate header.');
    }

    if (this.authInfo.authType === 'digest') {
      return createDigestAuthenticationString(
        this.authInfo,
        this.username,
        this.password,
        method,
        uri,
        this.clientNonce,
        this.nonceCount++,
        body);
    } else if (this.authInfo.authType === 'basic') {
      return createBasicAuthenticationString(this.username, this.password);
    } else {
      throw new Error('Internal error: unknown auth type "' + this.authInfo.authType + '"');
    }
  }

  previousFailedRequestWasStale(): boolean {
    return isSet(this.authInfo.stale) && this.authInfo.stale.toLowerCase() === 'true';
  }

  setWwwAuthenticate(wwwAuthenticate: string | string[]) {
    const authInfos: any = {};

    this.nonceCount = 1;
    this.clientNonce = random.createRandHexStringSync(16);

    if (Array.isArray(wwwAuthenticate)) {
      for (let i = 0; i < wwwAuthenticate.length; i++) {
        const authInfo = parseWwwAuthenticateHeader(wwwAuthenticate[i]);
        authInfos[authInfo.authType] = authInfo;
      }
    } else {
      const authInfo = parseWwwAuthenticateHeader(wwwAuthenticate);
      authInfos[authInfo.authType] = authInfo;
    }

    if (isSet(authInfos.digest)) {
      this.authInfo = authInfos.digest;
    } else if (isSet(authInfos.basic)) {
      this.authInfo = authInfos.basic;
    } else {
      const serverAcceptableAuthTypes: string[] = [];

      for (let key in authInfos) {
        if (!authInfos.hasOwnProperty(key)) {
          continue;
        }

        serverAcceptableAuthTypes.push(key);
      }

      throw new Error('No supported authorization types in ' + JSON.stringify(serverAcceptableAuthTypes));
    }
  }
}

export function getAuthorizeHeaderForWwwAuthenticate(
  authHeader: string | string[],
  username: string,
  password: string,
  clientNonce: string,
  nonceCount: number,
  method: string,
  path: string,
  body?: Buffer | string) {
  const authInfos: any = {};

  if (Array.isArray(authHeader)) {
    for (let i = 0; i < authHeader.length; i++) {
      const authInfo = parseWwwAuthenticateHeader(authHeader[i]);
      authInfos[authInfo.authType] = authInfo;
    }
  } else {
    const authInfo = parseWwwAuthenticateHeader(authHeader);
    authInfos[authInfo.authType] = authInfo;
  }

  if (isSet(authInfos.digest)) {
    return createDigestAuthenticationString(
      authInfos.digest,
      username,
      password,
      method,
      path,
      clientNonce,
      nonceCount,
      body);
  } else if (isSet(authInfos.basic)) {
    return createBasicAuthenticationString(username, password);
  } else {
    const serverAcceptableAuthTypes: string[] = [];

    for (let key in authInfos) {
      if (!authInfos.hasOwnProperty(key)) {
        continue;
      }

      serverAcceptableAuthTypes.push(key);
    }

    throw new Error('No supported authorization types in ' + JSON.stringify(serverAcceptableAuthTypes));
  }
}

export function md5(str: string | Buffer | Uint8Array): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

export function createDigestAuthenticationString(
  authInfo: any,
  username: string,
  password: string,
  method: string,
  uri: string,
  clientNonce: string,
  nonceCount: number, // a.k.a. increment by one for each time the same nonce is used. Avoids replay-attacks.
  body: Buffer | string | Uint8Array) {

  const qops = isSet(authInfo.qop) ? authInfo.qop.split(',') : [];
  let qopType;
  if (qops.indexOf('auth-int') >= 0) {
    qopType = 'auth-int';
  } else if (qops.indexOf('auth') >= 0) {
    qopType = 'auth';
  } else if (qops.length === 0) {
    qopType = null;
  } else if (qops.length > 0) {
    throw new Error('No supported QOP type in ' + JSON.stringify(qops));
  }

  const response = createDigestResponse(
    authInfo,
    username,
    password,
    method,
    uri,
    clientNonce,
    nonceCount,
    qopType,
    body);
  let authString = `Digest username="${username}", realm="${authInfo.realm}", nonce="${authInfo.nonce}", uri="${uri}", response="${response}"`;

  if (isSet(authInfo.opaque)) {
    authString += `, opaque="${authInfo.opaque}"`;
  }

  if (isSet(qopType)) {
    authString += `, qop=${qopType}, nc=${toPaddedHexString(nonceCount, 8)}, cnonce="${clientNonce}"`;
  }

  return authString;
}

export function createDigestResponse(
  authInfo: any,
  username: string,
  password: string,
  method: string,
  uri: string,
  clientNonce: string,
  nonceCount: number,
  qopType: string,
  body: string | Buffer | Uint8Array): string {
  let ha1;
  let ha2;

  if (notSet(body)) {
    body = Buffer.alloc(0);
  }

  if (notSet(authInfo.algorithm) || authInfo.algorithm === 'MD5') {
    const a1 = `${username}:${authInfo.realm}:${password}`;
    ha1 = md5(a1);
  } else if (authInfo.algorithm === 'MD5-sess') {
    const a1 = `${username}:${authInfo.realm}:${password}`;
    const ha1Md5 = md5(a1);
    ha1 = `${ha1Md5}:${authInfo.nonce}:${clientNonce}`;
  }

  if (notSet(qopType) || qopType === 'auth') {
    const a2 = `${method}:${uri}`;
    ha2 = md5(a2);
  } else if (qopType === 'auth-int') {
    const a2 = `${method}:${uri}:${md5(body)}`;
    ha2 = md5(a2);
  }

  if (qopType === 'auth' || qopType === 'auth-int') {
    if (notSet(authInfo.nonce)) {
      throw new Error('nonce must be set');
    } else if (notSet(clientNonce)) {
      throw new Error('cnonce must be set');
    }

    const responseString = `${ha1}:${authInfo.nonce}:${toPaddedHexString(nonceCount, 8)}:${clientNonce}:${qopType}:${ha2}`;
    return md5(responseString);
  } else {
    const responseString = `${ha1}:${authInfo.nonce}:${ha2}`;
    log.d(`Response string "${responseString}"`);
    return md5(responseString);
  }
}

export function toPaddedHexString(n: number, padTo: number): string {
  const hexStr = n.toString(16);
  return '0'.repeat(Math.max(0, padTo - hexStr.length)) + hexStr;
}

export function parseWwwAuthenticateHeader(headerValue: string): any {
  if (!isString(headerValue)) {
    throw new Error('Type error. headerValue must be a string.');
  }

  const authInfo: any = {};

  const originalHeaderValue = headerValue;

  while (headerValue.length > 0) {
    const equalsIndex = headerValue.indexOf('=');
    const spaceIndex = headerValue.indexOf(' ');

    if (spaceIndex >= 0 && equalsIndex >= 0 && spaceIndex < equalsIndex) {
      // Next part is "TYPE " not "VAR="
      const newAuthType = headerValue.substring(0, spaceIndex).toLowerCase();
      headerValue = headerValue.substring(spaceIndex + 1);

      authInfo.authType = newAuthType;
      continue;
    }

    if (equalsIndex < 0) {
      throw new Error('Could not parse WWW-Authenticate header "' + originalHeaderValue + '"');
    }

    const key = headerValue.substring(0, equalsIndex);
    headerValue = headerValue.substring(equalsIndex + 1);

    if (headerValue.startsWith('"')) {
      const matches = headerValue.match(/"([^"]|\\")*",? */);
      if (matches.length === 0) {
        throw new Error('Could not parse WWW-Authenticate header "' + originalHeaderValue + '"');
      }

      const stringValue = matches[0];
      const stringValueWithoutTrailingCharacters = stringValue.substring(0, stringValue.lastIndexOf('"') + 1);

      authInfo[key] = JSON.parse(stringValueWithoutTrailingCharacters);

      headerValue = headerValue.substring(matches[0].length);
    } else {
      let endOfValue = headerValue.indexOf(',');
      if (endOfValue < 0) {
        endOfValue = headerValue.length;
      }

      authInfo[key] = headerValue.substring(0, endOfValue);

      headerValue = headerValue.substring(endOfValue + 1).trimLeft();
    }
  }

  return authInfo;
}

export function createBasicAuthenticationString(username: string, password: string) {
  return 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
}
