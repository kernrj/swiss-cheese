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

import {notSet} from './util';

class QueueNode<T> {
  obj: T;
  next: QueueNode<T>;
}

class Queue<T> implements Iterable<T> {
  private head: QueueNode<T>;
  private tail: QueueNode<T>;

  pushBack(obj: T): void {
    if (notSet(this.tail)) {
      this.head = this.tail = {
        obj,
        next: null,
      };
    } else {
      this.tail.next = {
        obj,
        next: null,
      };

      this.tail = this.tail.next;
    }
  }

  popFront(): T {
    if (notSet(this.head)) {
      return null;
    }

    const oldHead = this.head;
    this.head = this.head.next;

    if (notSet(this.head)) {
      this.tail = null;
    }

    return oldHead.obj;
  }

  isEmpty(): boolean {
    return notSet(this.head);
  }

  clear(): void {
    this.head = null;
    this.tail = null;
  }

  pushFront(obj: T): void {
    const newHead = {
      obj,
      next: this.head,
    };

    this.head = newHead;
  }

  [Symbol.iterator](): Iterator<T> {
    let currentNode: QueueNode<T> = this.head;
    return {
      next(...args): IteratorResult<T> {
        if (notSet(currentNode)) {
          return {
            value: null,
            done: true,
          };
        }

        let result: IteratorResult<T>;
        const done = notSet(currentNode.next);

        if (done) {
          result = {
            value: currentNode.obj,
            done: true, // can't use a variable due to how IteratorResult is defined using true and false to indicate subtype instead of boolean.
          };
        } else {
          result = {
            value: currentNode.obj,
            done: false,
          };
        }

        currentNode = currentNode.next;

        return result;
      },
    };
  }
}

export {Queue};
