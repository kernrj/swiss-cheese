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

import {Timer, createTimer, TimeoutCanceledError} from '../src/Timer';

import chai = require('chai');

const expect = chai.expect;

describe('When a timer is not canceled', function () {
  it('its promise resolves', async () => {
    const timer = createTimer(0.01);
    await timer.waitForTimeout()
  });
});

describe('When a timer is canceled', function () {
  it('it throws a TimerCanceledException', async () => {
    const timer = createTimer(0.01);
    timer.cancel()

    try {
      await timer.waitForTimeout()
      chai.assert.fail('Exception was not thrown after canceling timeout.');
    } catch (e: any) {
      chai.expect(e).is.instanceof(TimeoutCanceledError);
    }
  });
});

describe('When a timer is ended early', function () {
  it('its promise resolves early', async () => {
    const timer = createTimer(1);
    timer.finishEarly();

    const startTimeMs = Date.now();
    await timer.waitForTimeout();
    const endTimeMs = Date.now();

    const waitTimeMs = endTimeMs - startTimeMs;
    chai.expect(waitTimeMs).is.lessThan(0.1);
  });
});