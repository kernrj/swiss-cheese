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

import util = require('./util');

export interface BackoffTimerCompletion {
  wasCancelled: boolean;
}

const millisecondsPerSecond: number = 1000.0;
const microsecondsPerMillisecond: number = 1000.0;

export class BackoffTimer {
  private readonly sleepDurationsInSeconds: number[] = [0, 1, 3, 5, 10, 30];

  private readonly resetAfterMilliseconds = 60 * millisecondsPerSecond;
  private iteration: number = 0;
  private lastWaitUtcTimeMs: number = 0;
  private timeout: NodeJS.Timeout;
  private timeoutResolve: (result: BackoffTimerCompletion) => void;

  mark(): void {
    const nowUs = Date.now();
    const nowMs = nowUs / microsecondsPerMillisecond;

    this.iteration++;
    this.lastWaitUtcTimeMs = nowMs;
  }

  willBlock(): boolean {
    return this.getWaitMilliseconds() > 0;
  }

  private getWaitMilliseconds(): number {
    const nowUs = Date.now();
    const nowMs = nowUs / microsecondsPerMillisecond;
    const durationSinceLastWaitMs = nowMs - this.lastWaitUtcTimeMs;

    if (util.notSet(this.timeout) && durationSinceLastWaitMs >= this.resetAfterMilliseconds) {
      this.iteration = 0;
      this.lastWaitUtcTimeMs = 0;

      return 0;
    }

    const sleepDurationIndex = Math.min(Math.max(0, this.iteration - 1), this.sleepDurationsInSeconds.length - 1);
    const expectedTimeBetweenWaitsMs = this.sleepDurationsInSeconds[sleepDurationIndex] * millisecondsPerSecond;
    const sleepDurationMs = Math.max(0, expectedTimeBetweenWaitsMs - durationSinceLastWaitMs);

    return sleepDurationMs;
  }

  async wait(): Promise<BackoffTimerCompletion> {
    const nowUs = Date.now();
    const nowMs = nowUs / microsecondsPerMillisecond;

    this.iteration++;
    this.lastWaitUtcTimeMs = nowMs;

    return new Promise<BackoffTimerCompletion>((resolve, reject) => {
      this.timeoutResolve = resolve;
      this.timeout = setTimeout(() => {
        this.timeout = null;
        this.timeoutResolve = null;

        resolve({
                  wasCancelled: false,
                });
      }, this.getWaitMilliseconds());
    });
  }

  cancel(): void {
    if (util.isSet(this.timeout)) {
      clearTimeout(this.timeout);

      const resolve = this.timeoutResolve;

      this.timeout = null;
      this.timeoutResolve = null;
      this.iteration = 0;
      this.lastWaitUtcTimeMs = 0;

      resolve({
                wasCancelled: true,
              });
    }
  }
}
