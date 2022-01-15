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

import crypto = require('crypto');

export async function createRandBuf(bufLen: number): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.randomBytes(bufLen, (err: Error, buf: Buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf);
      }
    });
  });
}

export async function createRandString(strLen: number, fromChars: string): Promise<string> {
  const charPoolLen: number = fromChars.length;

  if (charPoolLen > 256) {
    throw new Error('Too many characters in pool. Must be 256 or less.');
  }

  let randStr: string = '';
  let max = Math.floor(256 / charPoolLen) * charPoolLen - 1;
  let generatedChars = 0;
  while (generatedChars < strLen) {
    let buf: Buffer = await createRandBuf(strLen - generatedChars);
    for (let i = 0; i < buf.length; i++) {
      let rnum = buf[i];
      if (rnum > max) {
        continue;
      }

      randStr += fromChars[rnum % charPoolLen];
      generatedChars++;
    }
  }

  return randStr;
}

export function createRandStringSync(strLen: number, fromChars: string): string {
  const charPoolLen: number = fromChars.length;

  if (charPoolLen > 256) {
    throw new Error('Too many characters in pool. Must be 256 or less.');
  }

  let randStr: string = '';
  let max = Math.floor(256 / charPoolLen) * charPoolLen - 1;
  let generatedChars = 0;
  while (generatedChars < strLen) {
    let buf: Buffer = crypto.randomBytes(strLen - generatedChars);
    for (let i = 0; i < buf.length; i++) {
      let rnum = buf[i];
      if (rnum > max) {
        continue;
      }

      randStr += fromChars[rnum % charPoolLen];
      generatedChars++;
    }
  }

  return randStr;
}

const hexChars: string = '0123456789ABCDEF';

export async function createRandHexString(hexDigits: number): Promise<string> {
  let randStr: string = '';

  let odd: number = hexDigits & 1;
  let bufLen: number = hexDigits >> 1;

  let buf: Buffer = await createRandBuf(bufLen + odd);

  for (let i = 0; i < bufLen; i++) {
    let rnum = buf[i];

    randStr += hexChars[rnum >> 4];
    randStr += hexChars[rnum & 0xF];
  }

  //An extra byte was generated if the length is odd
  if (odd) {
    randStr += hexChars[buf[bufLen] & 0xF];
  }

  return randStr;
}

export function createRandHexStringSync(hexDigits: number): string {
  let randStr: string = '';

  let odd: number = hexDigits & 1;
  let bufLen: number = hexDigits >> 1;

  let buf: Buffer = crypto.randomBytes(bufLen + odd);

  for (let i = 0; i < bufLen; i++) {
    let rnum = buf[i];

    randStr += hexChars[rnum >> 4];
    randStr += hexChars[rnum & 0xF];
  }

  //An extra byte was generated if the length is odd
  if (odd) {
    randStr += hexChars[buf[bufLen] & 0xF];
  }

  return randStr;
}

export async function createRandBase64String(base64Digits: number): Promise<string> {
  let buf: Buffer = await createRandBuf(base64Digits);
  return buf.toString('base64');
}

export function createRandBase64StringSync(representedBytes: number): string {
  let buf: Buffer = crypto.randomBytes(representedBytes);
  return buf.toString('base64');
}
