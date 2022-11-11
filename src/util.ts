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

import process = require('process');
import child_process = require('child_process');
import {getLogger, ILogger} from './logger';
import fs = require('fs');
import {ScError, Status} from './error';

const log: ILogger = getLogger('swiss-cheese-util');

export function isSet(obj: any): boolean {
  return obj !== undefined && obj !== null;
}

export function notSet(obj: any): boolean {
  return obj === undefined || obj === null;
}

export function requireSet<Type>(t: Type, varName: string): Type {
  if (notSet(t)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be set.`);
  }

  return t;
}

export function getEnv(envKey:string, defaultValue:string) : string{
  if(process.env.hasOwnProperty(envKey))
    return process.env[envKey];
  else
    return defaultValue;
}

export function requireArray<T>(arr: T[], varName: string, typeChecker?: (value: T) => boolean): T[] {
  if (!Array.isArray(arr)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be an array, but is type ${typeof arr}, value ${JSON.stringify(arr)}`);
  }

  if (notSet(typeChecker)) {
    return arr;
  }

  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];

    if (!typeChecker(arr[i])) {
      throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be an array with a specific type, but element ${i} is type ${typeof value}, value ${JSON.stringify(value)}`);
    }
  }

  return arr;
}

export function requireNonEmptyArrayWithNoneUnset<Type>(arr: Type[], varName: string): Type[] {
  if (!Array.isArray(arr)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array of non-null elements, but it is type ${typeof arr}`);
  } else if (arr.length === 0) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array of non-null elements, but it is an empty array`);
  }

  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];

    if (!isSet(element)) {
      throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array of the same type, but element ${i} is not set`);
    }
  }

  return arr;
}

export function requireNonEmptyArrayOfNonEmptyStrings<Type>(arr: string[], varName: string): string[] {
  if (!Array.isArray(arr)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array of non-empty strings, but it is type ${typeof arr}`);
  } else if (arr.length === 0) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array of non-empty strings, but it is an empty array`);
  }

  for (let i = 0; i < arr.length; i++) {
    const str = arr[i];

    if (!isString(str)) {
      throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array of non-empty strings, but element ${i} is type ${typeof str}`);
    } else if (str.length === 0) {
      throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array of non-empty strings, but element ${i} is an empty string`);
    }
  }

  return arr;
}

export function requireSetToAnyOf<Type>(t: Type, allowedValues: Type[], varName: string): Type {
  requireSet(t, varName);

  if (notSet(allowedValues) || !Array.isArray(allowedValues)) {
    throw new ScError(Status.INVALID_PARAMETER, `Cannot check '${varName}': 'allowedValues' must be an array, but it is type ${typeof allowedValues}`);
  }

  const found: boolean = allowedValues.indexOf(t) >= 0;

  if (!found) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be one of ${JSON.stringify(allowedValues)}, but it is ${JSON.stringify(t)}`);
  }

  return t;
}

export function requireBuffer(obj: any, varName: string): Buffer {
  if (notSet(obj) || !Buffer.isBuffer(obj)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a Buffer, but it is type ${typeof obj}`);
  }

  return obj as Buffer;
}

export function requireString(obj: any, varName: string): string {
  if (notSet(obj) || !isString(obj)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a string, but it is type ${typeof obj}, value ${JSON.stringify(obj)}`);
  }

  return obj as string;
}

export function isNonEmptyString(obj: any): boolean {
  return isString(obj) && obj.length > 0;
}

export function requireNonEmptyString(obj: any, varName: string): string {
  const str = requireString(obj, varName);

  if (str.length === 0) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must not be an empty string.`);
  }

  return str;
}

export function requireStringStartingWith(obj: any, startsWith: string, varName: string): string {
  const str = requireString(obj, varName);

  if (notSet(startsWith)) {
    throw new ScError(Status.INVALID_PARAMETER, `Error checking '${varName}': startsWith must be set.`);
  }

  if (!str.startsWith(startsWith)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must start with '${startsWith}', but it's value is ${JSON.stringify(str)}`);
  }

  return str;
}

export function requireInt(n: any, varName: string): number {
  if (!Number.isSafeInteger(n)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be an integer, but it is type ${typeof n}, value ${JSON.stringify(n)}`);
  }

  return n;
}

export function requireNumber(n: any, varName: string): number {
  if (!isNumber(n)) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a number, but is type ${typeof n}, value ${JSON.stringify(n)}`);
  }

  return n as number;
}

export function requireNonNegativeNumber(n: any, varName: string): number {
  if (!Number.isFinite(n) || (n as number) < 0) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-negative number, but it is ${JSON.stringify(n)}`);
  }

  return n;
}

export function requireNonNegativeInt(n: any, varName: string): number {
  if (!Number.isSafeInteger(n) || (n as number) < 0) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-negative integer, but it is ${JSON.stringify(n)}`);
  }

  return n;
}

export function requirePositiveInt(n: any, varName: string): number {
  if (!Number.isSafeInteger(n) || (n as number) <= 0) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a positive integer, but it is ${JSON.stringify(n)}`);
  }

  return n;
}

export function requireIntInRange(n: any, min: number, max: number, varName: string): number {
  const i = requireInt(n, varName);

  if (i < min || i > max) {
    throw new ScError(Status.INVALID_PARAMETER, `Required range: ${min} <= ${varName} <= ${max}, but ${varName} = ${JSON.stringify(n)}`);
  }

  return i;
}

export function parseIntOr(toParse: string, defaultValue: number): number {
  if (isSet(defaultValue)) {
    requireInt(defaultValue, 'defaultValue');
  }

  const n: number = parseInt(toParse);

  if (!Number.isSafeInteger(n)) {
    return defaultValue;
  }

  return n;
}

export function parseIntOrThrow(toParse: string, varName: string): number {
  requireNonEmptyString(varName, 'varName');

  const n: number = parseInt(toParse);

  if (!Number.isSafeInteger(n)) {
    throw new ScError(Status.INVALID_PARAMETER, `Could not parse ${varName} value ${JSON.stringify(toParse)} as an integer.`);
  }

  return n;
}

export function parseNumberOr(toParse: string, defaultValue: number): number {
  if (isSet(defaultValue)) {
    requireInt(defaultValue, 'defaultValue');
  }

  const n: number = parseFloat(toParse);

  if (notSet(n) || !Number.isFinite(n)) {
    return defaultValue;
  }

  return n;
}

export function requireFilePathSync(filePath: string, varName: string): string {
  requireNonEmptyString(filePath, varName);

  if (!fs.existsSync(filePath)) {
    throw new ScError(Status.INVALID_PARAMETER, `${varName} path '${filePath}' does not exist.`);
  }

  const stats: fs.Stats = fs.statSync(filePath);

  if (!stats.isFile()) {
    throw new ScError(Status.INVALID_PARAMETER, `${varName} path '${filePath}' is not a file.`);
  }

  return filePath;
}

export function getStringEnvOrDie(envKey: string): string {
  if (process.env.hasOwnProperty(envKey)) {
    return process.env[envKey];
  } else {
    throw new ScError(Status.INVALID_PARAMETER, `Required environment variable '${envKey}' is not set.`);
  }
}

export function getStringEnv(envKey: string, defaultValue: string): string {
  if (process.env.hasOwnProperty(envKey)) {
    return process.env[envKey];
  } else {
    return defaultValue;
  }
}

export function getNumericEnvOrDie(envKey: string): number {
  if (process.env.hasOwnProperty(envKey)) {
    return +process.env[envKey];
  } else {
    throw new ScError(Status.INVALID_PARAMETER, `Required environment variable '${envKey}' is not set.`);
  }
}

export function getNumericEnv(envKey: string, defaultValue: number): number {
  if (process.env.hasOwnProperty(envKey)) {
    return +process.env[envKey];
  } else {
    return defaultValue;
  }
}

export function forEachOwned(obj: any, fnc: (key: string, value: any) => void) {
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }

    fnc(key, obj[key]);
  }
}

export async function forEachOwnedAsync(obj: any, fnc: (key: string, value: any) => Promise<any>) {
  const promises: Promise<any>[] = [];

  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }

    promises.push(fnc(key, obj[key]));
  }

  return Promise.all(promises);
}

export async function waitFor(seconds: number): Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, seconds * 1000);
  });
}

export function zeroPad(n: number, numLen: number) {
  return n.toString().padStart(numLen, '0');
}

export function shallowCopyOwnProperties(from: any, to: any) {
  if (notSet(from)) {
    return;
  }

  requireSet(to, 'to');

  for (let key in from) {
    if (from.hasOwnProperty(key)) {
      to[key] = from[key];
    }
  }
}

export function getOwnedKeys(obj: any): string[] {
  if (notSet(obj)) {
    return [];
  }

  const keys: string[] = [];

  forEachOwned(obj, (key: string, value: any) => {
    keys.push(key);
  });

  return keys;
}

export function get<Type>(obj: any, key: string, defaultValue: Type): Type {
  if (notSet(obj) || notSet(obj[key])) {
    return defaultValue;
  }

  return obj[key];
}

export function valueOr<Type>(value: any, defaultValue: Type): Type {
  if (notSet(value)) {
    return defaultValue;
  }

  return value;
}

export function utcDateWithMs(date: Date): string {
  return date.getUTCFullYear() +
    '-' +
    zeroPad(date.getUTCMonth() + 1, 2) +
    '-' +
    zeroPad(date.getUTCDate(), 2) +
    ' ' +
    zeroPad(date.getUTCHours(), 2) +
    ':' +
    zeroPad(date.getUTCMinutes(), 2) +
    ':' +
    zeroPad(date.getUTCSeconds(), 2) +
    '.' +
    zeroPad(date.getUTCMilliseconds(), 3) +
    ' GMT';
}

export function setTimeoutPromise(waitForMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, waitForMs);
  });
}

export function wrapAsyncFunctionWithNoArguments(description: string, asyncFunction: () => Promise<any>): () => void {
  return function () {
    asyncFunction().catch((error: Error) => {
      log.e(`${description}: Error "${error.message}" at ${error.stack}`);
    });
  };
}

export async function stopProcess(childProcess: child_process.ChildProcess, signal: string): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    if (notSet(childProcess) || childProcess.killed) {
      resolve({});
      return;
    }

    let promiseSatisfied: boolean = false;

    childProcess.on('exit', (code, signal1) => {
      if (promiseSatisfied) {
        return;
      }

      promiseSatisfied = true;

      resolve({
                code,
                signal,
              });
    });

    childProcess.on('error', (error: Error) => {
      if (promiseSatisfied) {
        return;
      }

      promiseSatisfied = true;

      reject(error);
    });
  });
}

export function isBoolean(obj: any): boolean {
  return typeof obj === 'boolean';
}

export function isNumber(obj: any): boolean {
  return typeof obj === 'number';
}

export function isString(obj: any): boolean {
  return typeof obj === 'string';
}

export function isObject(obj: any): boolean {
  return typeof obj === 'object';
}

export function isFunction(obj: any): boolean {
  return typeof obj === 'function';
}

export function bufferFromChunk(chunk: any, encoding: BufferEncoding): Buffer {
  if (Buffer.isBuffer(chunk)) {
    return chunk as Buffer;
  } else if (isString(chunk)) {
    return Buffer.from(chunk as string, encoding);
  } else {
    throw new ScError(Status.INTERNAL_ERROR, `Unexpected chunk type '${typeof chunk}`);
  }
}

export async function waitForSpawn(childProcess: child_process.ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    let errorListener: (error: Error) => void;
    let spawnListener = () => {
      childProcess.removeListener('error', errorListener);
      resolve();
    };

    errorListener = (error: Error) => {
      childProcess.removeListener('spawn', spawnListener);
      reject(error);
    };

    childProcess.once('spawn', spawnListener);
    childProcess.once('error', errorListener);
  });
}

export async function runWithRetry<T>(doTask: () => Promise<T>, retryCount?: number, retryIntervalInSeconds?: number): Promise<T> {
  if (notSet(retryCount)) {
    retryCount = 2;
  }

  if (notSet(retryIntervalInSeconds)) {
    retryIntervalInSeconds = 1;
  }

  requireInt(retryCount, 'retryCount');
  requireNumber(retryIntervalInSeconds, 'retryIntervalInSeconds');

  let error: Error;
  let result: T;
  const retryForever = retryCount < 0;
  for (let i = 0; retryForever || i <= retryCount; i++) {
    try {
      result = await doTask();
      break;
    } catch (e) {
      error = e;
      await waitFor(retryIntervalInSeconds);
    }
  }

  if (isSet(error)) {
    throw error;
  }

  return result;
}

export function requireNonEmptyArray<T>(arr: T[], varName: string, typeChecker?: (value: T) => boolean): T[] {
  requireArray(arr, varName, typeChecker);

  if (arr.length === 0) {
    throw new ScError(Status.INVALID_PARAMETER, `'${varName}' must be a non-empty array`);
  }

  return arr;
}

export function getPathWithCreate(obj: any, path: any[]): any {
  requireSet(obj, 'obj');
  requireArray(path, 'path');

  let rootObject: any = valueOr(obj, {});

  for (let i = 0; i < path.length; i++) {
    let subObject: any = rootObject[path[i]];

    if (notSet(rootObject[path[i]])) {
      subObject = {};
      rootObject[path[i]] = subObject;
    } else {
      subObject = rootObject[path[i]];
    }

    rootObject = subObject;
  }

  return rootObject;
}

export function getPath<T>(obj: any, path: any[], defaultValue: T): T {
  if (notSet(obj)) {
    return defaultValue;
  }

  requireArray(path, 'path');

  let rootObject: any = valueOr(obj, {});

  for (let i = 0; i < path.length; i++) {
    let subObject: any = rootObject[path[i]];

    if (notSet(rootObject[path[i]])) {
      return defaultValue;
    } else {
      subObject = rootObject[path[i]];
    }

    rootObject = subObject;
  }

  return rootObject;
}

export function set(obj: any, path: string[], value: any): void {
  requireSet(obj, 'obj');
  requireNonEmptyArray(path, 'path', isString);

  const rootObject: any = getPathWithCreate(obj, path.slice(0, path.length - 1));

  rootObject[path[path.length - 1]] = value;
}
