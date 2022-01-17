import {getLogger} from './Logger';
import random = require('./random');
import {notSet, isSet} from './util';

const log = getLogger('Errors');

export enum Status {
  OK,
  INVALID_PARAMETER,
  INTERNAL_ERROR,
  EXISTS,
  AUTHENTICATION_FAILED,
  NOT_AUTHORIZED,
  NOT_FOUND,
  NOT_ALLOWED,
  BAD_REQUEST,
  EXTERNAL_ERROR,
  HASH_MISMATCH,
  NOT_AVAILABLE,
}

export class ScError extends Error {
  constructor(authStatus: Status,
              userMessage: string,
              logMessage: string = null) {
    super(userMessage);

    this.logMessage = logMessage;
    this.status = authStatus;
  }

  logMessage: string;
  status: Status;
}

///Returns an error ID
export function logError(err: Error): string {
  let errorID: string = random.createRandHexStringSync(8);

  const errObj: any = err;
  const statusStr: string = isSet(errObj['status']) ? ('Status ' + errObj['status'] + ', ') : '';
  const logPrefix = '[Error ' + errorID + ']: ';
  let msg = logPrefix + statusStr + '\n';

  if (notSet(err))
    msg += '<NULL ERROR OBJECT>';
  else if (notSet(err.stack))
    msg += err.message;
  else
    msg += err.stack;

  log.e(msg);

  return errorID;
}

export function statusToString(status: Status): string {
  return Status[status]; //returns string version of status
}
