/*
 * Copyright 2020 Rick Kern <kernrj@gmail.com>
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

import chai = require('chai');
import util = require('../src/util');

const expect = chai.expect;

describe('util.get', function () {
  const obj = {
    hi: 'hi',
  };

  it('works when value is present', async () => {
    expect(util.get(obj, 'hi', null)).equals('hi');
  });

  it ('returns the default value when not present', async() => {
    expect(util.get(obj, 'no', 'what')).equals('what');
  })
});

describe('util.getPath', function () {
  const obj = {
    hi: 'hi',
    hello: {
      aNumber: 1,
      aString: 'string',
      anObject: {
        aString: 'another string',
        aNumber: 2,
      }
    },
  };

  it('works when value is present at the root level', async () => {
    expect(util.getPath(obj, ['hi'], null)).equals('hi');
  });
  it('works when value is present one level down', async () => {
    expect(util.getPath(obj, ['hello', 'aNumber'], null)).equals(1);
  });
  it('works when value is present two levels down', async () => {
    expect(util.getPath(obj, ['hello', 'anObject', 'aString'], null)).equals('another string');
  });

  it ('returns the root object when path is empty', async() => {
    expect(util.getPath(obj, [], 'the default value')).equals(obj);
  });

  it ('returns the default value when value is not present at the root', async() => {
    expect(util.getPath(obj, ['no1'], 'the default value')).equals('the default value');
    expect(util.getPath(obj, ['no1', 'no2'], 'the default value')).equals('the default value');
    expect(util.getPath(obj, ['no1', 'no2', 'no3'], 'the default value')).equals('the default value');
  });
  it ('returns the default value when value is not present one level down', async() => {
    expect(util.getPath(obj, ['hello', 'no2'], 'the default value')).equals('the default value');
    expect(util.getPath(obj, ['hello', 'no2', 'no3'], 'the default value')).equals('the default value');
  });
  it ('returns the default value when value is not present three levels down', async() => {
    expect(util.getPath(obj, ['hello', 'anObject', 'no3'], 'the default value')).equals('the default value');
  });
});

describe('util.getPathWithCreate', function () {
  const obj: any = {
    hi: 'hi',
    hello: {
      aNumber: 1,
      aString: 'string',
      anObject: {
        aString: 'another string',
        aNumber: 2,
      }
    },
  };

  it('works when value is present at the root level', async () => {
    expect(util.getPathWithCreate(obj, ['hi'])).equals('hi');
  });
  it('works when value is present one level down', async () => {
    expect(util.getPathWithCreate(obj, ['hello', 'aNumber'])).equals(1);
  });
  it('works when value is present two levels down', async () => {
    expect(util.getPathWithCreate(obj, ['hello', 'anObject', 'aString'])).equals('another string');
  });

  it ('returns the root object when path is empty', async() => {
    expect(util.getPathWithCreate(obj, [])).equals(obj);
  });

  it ('creates the path when value is not present at the root', async() => {
    util.getPathWithCreate(obj, ['no1_1']);
    const firstObject = obj['no1_1'];
    expect(util.isSet(firstObject)).equals(true);

    let itemCount: number = 0;
    util.forEachOwned(obj['no1_1'], (obj: any) => {
      itemCount++;
    });

    expect(itemCount).equals(0);


    util.getPathWithCreate(obj, ['no1_2', 'hi', 'bye']);

    itemCount = 0;
    const secondObject = obj['no1_2']['hi']['bye'];
    expect(util.isSet(secondObject)).equals(true);
    util.forEachOwned(obj['no1_2']['hi']['bye'], (value: any) => {
      itemCount++;
    });

    expect(itemCount).equals(0);
  });
});

describe('util.set', function () {
  const obj: any = {};

  it('works when value is present at the root level', async () => {
    util.set(obj, ['hi'], 'hi');
    expect(obj['hi']).equals('hi');
  });
  it('works when value is present one level down', async () => {
    util.set(obj, ['anObject', 'what'], 'value');
    expect(obj['anObject']['what']).equals('value');

    util.set(obj, ['key2', 'what2'], 'value2');
    expect(obj['key2']['what2']).equals('value2');
  });
  it('works when value is present two levels down', async () => {
    util.set(obj, ['anObject', 'what4', 'key4'], 'value4');
    expect(obj['anObject']['what4']['key4']).equals('value4');

    util.set(obj, ['hi5', 'what5', 'key5'], 'value5');
    expect(obj['hi5']['what5']['key5']).equals('value5');
  });
});
