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

import {Queue} from './Queue';

export interface PoolObject<T> {
  item: T;
  doneWithItemCallback: () => void;
}

export class Pool<T> {
  private readonly queue: Queue<T> = new Queue<T>();
  private readonly createElement: () => T;

  constructor(createElement: () => T) {
    this.createElement = createElement;
  }

  get(): PoolObject<T> {
    let value: T;

    if (this.queue.isEmpty()) {
      value = this.createElement();
    } else {
      value = this.queue.popFront();
    }

    return {
      item: value,
      doneWithItemCallback: () => {
        this.queue.pushBack(value);
      },
    };
  }
}
