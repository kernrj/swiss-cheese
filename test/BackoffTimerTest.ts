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

import {BackoffTimer} from '../src/BackoffTimer';

import chai = require('chai');

const expect = chai.expect;

describe('When a BackoffTimer is not marked', function () {
  it('it does not block', async () => {
    const backoffTimer = new BackoffTimer();

    expect(backoffTimer.willBlock()).to.equal(false);
  });
});

describe('When a BackoffTimer is marked once', function () {
  it('it does not block', async () => {
    const backoffTimer = new BackoffTimer();

    expect(backoffTimer.willBlock()).to.equal(false);

    backoffTimer.mark();

    expect(backoffTimer.willBlock()).to.equal(false);
  });
});

describe('When a BackoffTimer is marked twice', function () {
  it('it blocks the second time', async () => {
    const backoffTimer = new BackoffTimer();

    expect(backoffTimer.willBlock()).to.equal(false);

    backoffTimer.mark();

    expect(backoffTimer.willBlock()).to.equal(false);

    backoffTimer.mark();

    expect(backoffTimer.willBlock()).to.equal(true);
  });
});