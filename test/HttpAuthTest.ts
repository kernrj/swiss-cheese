/*
 * Copyright 2020-2022 Rick Kern <kernrj@gmail.com>
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

import auth = require('../src/HttpAuth');

import chai = require('chai');

const expect = chai.expect;

describe('When padded to a width of 8', function () {
  it('padding 0 produces eight 0\'s', () => {
    expect(auth.toPaddedHexString(0, 8)).to.equal('00000000');
  });

  it('padding 1 produces correct padding', () => {
    expect(auth.toPaddedHexString(1, 8)).to.equal('00000001');
  });
});

describe('When padding to a width of 0', function () {
  it('padding 0 produces no padding', () => {
    expect(auth.toPaddedHexString(0, 0)).to.equal('0');
  });

  it('padding 1 produces no padding', () => {
    expect(auth.toPaddedHexString(1, 0)).to.equal('1');
  });

  it('padding 10 produces no padding and lowercase hex', () => {
    expect(auth.toPaddedHexString(10, 0)).to.equal('a');
  });
});

describe('When Basic authentication is used', () => {
  it('produces the correct value', () => {
    const authString = auth.createBasicAuthenticationString('Aladdin', 'open sesame');
    expect(authString).to.equal('Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');
  });
});

describe('When Digest authentication is used with qop=auth', () => {
  const authInfo: any = {
    authType: 'digest',
    realm: 'testrealm@host.com',
    nonce: 'dcd98b7102dd2f0e8b11d0f600bfb0c093',
    opaque: '5ccc069c403ebaf9f0171e9517f40e41',
    qop: 'auth',
  };

  const clientNonce = '0a4f113b';

  const authString = auth.createDigestAuthenticationString(
    authInfo,
    'Mufasa',
    'Circle Of Life',
    'GET',
    '/dir/index.html',
    clientNonce,
    1,
    null);

  it('produces the correct authentication type', () => {
    expect(authString.indexOf('Digest ')).to.be.equal(0);
  });

  it('has the correct username', () => {
    expect(authString).to.include('username="Mufasa"');
  });

  it('has the correct realm', () => {
    expect(authString).to.include('realm="testrealm@host.com"');
  });

  it('has the correct nonce', () => {
    expect(authString).to.include('nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093"');
  });

  it('has the correct uri', () => {
    expect(authString).to.include('uri="/dir/index.html"');
  });

  it('has the correct qop', () => {
    expect(authString).to.include('qop=auth');
  });

  it('has the correct nonceCount', () => {
    expect(authString).to.include('nc=00000001');
  });

  it('has the correct cnonce', () => {
    expect(authString).to.include('cnonce="0a4f113b"');
  });

  it('has the correct response', () => {
    expect(authString).to.include('response="6629fae49393a05397450978507c4ef1"');
  });

  it('has the correct opaque value', () => {
    expect(authString).to.include('opaque="5ccc069c403ebaf9f0171e9517f40e41"');
  });
});

describe('When Digest authentication is used with qop not set', () => {
  const wwwAuthenticate = 'Digest ' +
    'realm="testrealm@host.com", ' +
    'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", ' +
    'opaque="5ccc069c403ebaf9f0171e9517f40e41"';

  const clientNonce = '0a4f113b';

  const authString = auth.getAuthorizeHeaderForWwwAuthenticate(
    wwwAuthenticate,
    'Mufasa',
    'CircleOfLife',
    clientNonce,
    1,
    'GET',
    '/dir/index.html');

  it('produces the correct authentication type', () => {
    expect(authString.indexOf('Digest ')).to.equal(0);
  });

  it('has the correct username', () => {
    expect(authString).to.include('username="Mufasa"');
  });

  it('has the correct realm', () => {
    expect(authString).to.include('realm="testrealm@host.com"');
  });

  it('has the correct nonce', () => {
    expect(authString).to.include('nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093"');
  });

  it('has the correct uri', () => {
    expect(authString).to.include('uri="/dir/index.html"');
  });

  it('has the correct response', () => {
    expect(authString).to.include('response="1949323746fe6a43ef61f9606e7febea"');
  });

  it('has the correct opaque value', () => {
    expect(authString).to.include('opaque="5ccc069c403ebaf9f0171e9517f40e41"');
  });
});

describe('When Digest authentication is used with HttpAuthenticator and qop is not set', () => {
  const wwwAuthenticate = 'Digest ' +
    'realm="testrealm@host.com", ' +
    'nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", ' +
    'opaque="5ccc069c403ebaf9f0171e9517f40e41"';

  const authenticator = new auth.HttpAuthenticator();
  authenticator.setWwwAuthenticate(wwwAuthenticate);
  authenticator.setCredentials('Mufasa', 'CircleOfLife');

  const authString = authenticator.getAuthorizationHeader('GET', '/dir/index.html');

  it('produces the correct authentication type', () => {
    expect(authString.indexOf('Digest ')).to.equal(0);
  });

  it('has the correct username', () => {
    expect(authString).to.include('username="Mufasa"');
  });

  it('has the correct realm', () => {
    expect(authString).to.include('realm="testrealm@host.com"');
  });

  it('has the correct nonce', () => {
    expect(authString).to.include('nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093"');
  });

  it('has the correct uri', () => {
    expect(authString).to.include('uri="/dir/index.html"');
  });

  it('has the correct response', () => {
    expect(authString).to.include('response="1949323746fe6a43ef61f9606e7febea"');
  });

  it('has the correct opaque value', () => {
    expect(authString).to.include('opaque="5ccc069c403ebaf9f0171e9517f40e41"');
  });
});

describe('When using the output of an FFmpeg run', () => {
  const wwwAuthenticate = 'Digest realm="IP Camera(C4472)", nonce="a49568c59afb35d9a52fef90b8f027f4", stale="FALSE"';

  const authenticator = new auth.HttpAuthenticator();
  authenticator.setWwwAuthenticate(wwwAuthenticate);
  authenticator.setCredentials('test', 'test12345');

  const authString = authenticator.getAuthorizationHeader('DESCRIBE', 'rtsp://192.168.1.52:554/');

  it('produces the correct authentication type', () => {
    expect(authString.indexOf('Digest ')).to.equal(0);
  });

  it('has the correct username', () => {
    expect(authString).to.include('username="test"');
  });

  it('has the correct realm', () => {
    expect(authString).to.include('realm="IP Camera(C4472)"');
  });

  it('has the correct nonce', () => {
    expect(authString).to.include('nonce="a49568c59afb35d9a52fef90b8f027f4"');
  });

  it('has the correct uri', () => {
    expect(authString).to.include('uri="rtsp://192.168.1.52:554/"');
  });

  it('has the correct response', () => {
    expect(authString).to.include('response="387d75f8ffdb80944ae586c8d4052eb8"');
  });
});
