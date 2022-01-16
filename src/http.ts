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

import http = require('http');
import https = require('https');
import stream = require('stream');
import util = require('./util');

import {
  IncomingMessage,
  OutgoingHttpHeaders,
  RequestOptions,
} from 'http';

import {
  URL,
} from 'url';

import {getLogger} from './logger';

const log = getLogger('swiss-cheese-http');

export const HttpHeaders = Object.freeze({
                                           CONTENT_LENGTH: 'content-length',
                                           CONTENT_TYPE: 'content-type',
                                           ACCEPT: 'accept',
                                           HOST: 'host',
                                           DATE: 'date',
                                           FORWARDED_FOR: 'x-forwarded-for',
                                           FORWARDED_PROTO: 'x-forwarded-proto',
                                           EXPECT: 'expect',
                                           ETAG: 'etag',
                                         });

export interface QueryParams {
  [Key: string]: any;
}

export const HttpMethod = Object.freeze({
                                          GET: 'GET',
                                          PUT: 'PUT',
                                          POST: 'POST',
                                          DELETE: 'DELETE',
                                          HEAD: 'HEAD',
                                          CONNECT: 'CONNECT',
                                          OPTIONS: 'OPTIONS',
                                          TRACE: 'TRACE',
                                          PATCH: 'PATCH',
                                        });

export enum HttpStatus {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,

  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,

  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  USE_PROXY = 305,
  TEMPORARY_REDIRECT = 307,

  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  REQUEST_ENTITY_TOO_LARGE = 413,
  REQUEST_URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  REQUEST_RANGE_NOT_SATISFIABLE = 416,

  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
}

export interface HttpRequestResult {
  bodyStream: stream.Writable;
  responsePromise: Promise<HttpResponse>;
}

export class HttpResponse {
  constructor(code: HttpStatus,
              message: string,
              headers: OutgoingHttpHeaders,
              responseBodyStream: stream.Readable) {
    this.statusCode = code;
    this.statusMessage = message;
    this.responseBodyStream = responseBodyStream;
    this.headers = headers;
  }

  responseBodyStream: stream.Readable;
  headers: OutgoingHttpHeaders;
  statusCode: HttpStatus;
  statusMessage: string;
}

export function httpMakeStreamedRequest(
  url: string,
  method: string,
  secure: boolean,
  headers: OutgoingHttpHeaders): Promise<HttpRequestResult> {
  return new Promise<HttpRequestResult>((resolveRequestResult, rejectRequestResult) => {
    const proto: any = secure ? https : http;
    const parsedURL: URL = new URL(url);
    let path: string = parsedURL.pathname;
    if (parsedURL.search) {
      path += parsedURL.search; //search contains initial '?'
    }

    const reqOpts: RequestOptions = {
      'protocol': secure ? 'https:' : 'http:',
      'hostname': parsedURL.hostname,
      'port': parsedURL.port,
      'method': method,
      'headers': headers,
      'path': path,
    };

    let resolveResponsePromise: (response: HttpResponse) => void;
    let rejectResponsePromise: (error: any) => void;

    const responsePromise = new Promise<HttpResponse>((resolve, reject) => {
      resolveResponsePromise = resolve;
      rejectResponsePromise = reject;
    });

    const expect100Continue: boolean = headers[HttpHeaders.EXPECT] === '100-continue';
    let received100Continue: boolean = false;

    const request: http.OutgoingMessage = proto.request(reqOpts,
                                                        (res: IncomingMessage) => {
                                                          if (res.statusCode === HttpStatus.CONTINUE && !received100Continue) {
                                                            log.i('Got 100-continue');
                                                            received100Continue = true;

                                                            resolveRequestResult({
                                                                                   bodyStream: request,
                                                                                   responsePromise,
                                                                                 });

                                                            return;
                                                          }

                                                          const streamedResponse: HttpResponse = new HttpResponse(
                                                            +res.statusCode as HttpStatus,
                                                            res.statusMessage,
                                                            res.headers,
                                                            res);

                                                          if (streamedResponse.statusCode !== HttpStatus.OK) {
                                                            const requestString: string = JSON.stringify(reqOpts, null, 2);
                                                            const responseHeaderString: string = JSON.stringify(streamedResponse.headers, null, 2);

                                                            log.i(
                                                              'HTTP Request error ' +
                                                              streamedResponse.statusCode +
                                                              ' ' +
                                                              streamedResponse.statusMessage +
                                                              '. Request: ' +
                                                              requestString +
                                                              ' Response Headers: ' +
                                                              responseHeaderString);
                                                          }

                                                          const didNotReceiveExpected100Continue: boolean = expect100Continue && !received100Continue;
                                                          if (didNotReceiveExpected100Continue) {
                                                            resolveRequestResult({
                                                                                   bodyStream: request,
                                                                                   responsePromise,
                                                                                 });
                                                          }

                                                          resolveResponsePromise(streamedResponse);
                                                        });

    request.on('error', (err: any) => {
      log.i('Request Error ' + err.message + ' to ' + JSON.stringify(reqOpts, null, 2) + ' at ' + err.stack);

      if (expect100Continue && !received100Continue) {
        rejectRequestResult(err);
      } else {
        rejectResponsePromise(err);
      }
    });

    request.on('abort', () => {
      log.i('Request aborted to "' + JSON.stringify(reqOpts, null, 2));

      if (expect100Continue && !received100Continue) {
        rejectRequestResult(new Error('Connection aborted.'));
      } else {
        rejectResponsePromise(new Error('Connection aborted.'));
      }
    });

    if (!expect100Continue) {
      resolveRequestResult({
                             bodyStream: request,
                             responsePromise,
                           });
    }
  });
}

export function httpMakeRequest(options: RequestOptions, body: string): Promise<HttpResponse> {
  return new Promise<HttpResponse>((resolve, reject) => {
    let done: boolean = false;
    let streamedResponse: HttpResponse;

    let proto: any = options.protocol === 'https:' ? https : http;
    let req: http.ClientRequest = proto.request(options, (res: any) => {
      streamedResponse = new HttpResponse(res.statusCode as HttpStatus,
                                          res.statusMessage,
                                          res.headers,
                                          res);

      resolve(streamedResponse);
    });

    req.on('error', (err: Error) => {
      log.e('Connection error: ' + err + '\n' + err.stack);

      if (done) {
        return;
      }

      done = true;

      if (util.isSet(streamedResponse)) {
        log.e('Destroying connection because promise was already resolved.');
        streamedResponse.responseBodyStream.destroy(err); //already resolved
      } else {
        reject(err);
      }
    });

    req.on('abort', () => {
      log.e('Connection aborted');

      if (done) {
        return;
      }

      done = true;

      let err: Error = new Error('Connection aborted.');
      if (util.isSet(streamedResponse)) {
        log.e('Destroying connection because promise was already resolved.');
        streamedResponse.responseBodyStream.destroy(err); //already resolved
      } else
        reject(err);
    });

    if (util.isSet(body))
      req.write(body, 'utf8');

    req.end();
  });
}
