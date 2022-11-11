export interface Timer {
  cancel(): void;
  finishEarly(): void;
  waitForTimeout(): Promise<any>;
}

export class TimeoutCanceledError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export function createTimer(durationSeconds: number): Timer {
  return new TimerImpl(durationSeconds);
}

const msPerSecond = 1000;

class TimerImpl implements Timer {
  private readonly timeout: NodeJS.Timeout
  private readonly finishedPromise: Promise<any>
  private resolvePromise: (value: any) => any
  private rejectPromise: (error: Error) => any
  private resolved = false

  constructor(durationSeconds: number) {
    this.timeout = setTimeout(() => {
      this.resolvePromise(null);
    }, durationSeconds * msPerSecond);

    this.finishedPromise = new Promise<any>((resolve, reject) => {
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
    });
  }

  cancel(): void {
    if (this.resolved) {
      return;
    }

    this.resolved = true
    this.rejectPromise(new TimeoutCanceledError());
  }

  finishEarly(): void {
    if (this.resolved) {
      return;
    }

    this.resolved = true
    this.resolvePromise(null);
  }

  waitForTimeout(): Promise<any> {
    return this.finishedPromise;
  }
}
