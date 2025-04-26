export class AppointTimeCall {
  readonly interval: number;
  private next_time: number | null = null;
  private call_func: (() => unknown) | null = null;
  private timeout: NodeJS.Timeout | null = null;

  /**
   * @param interval - in milliseconds
   */
  constructor(interval: number) {
    this.interval = interval;
  }

  // biome-ignore lint/suspicious/noExplicitAny: any function type
  setNext(func: (...args: any[]) => any) {
    this.call_func = func;
    if (this.next_time === null) {
      this.next_time = Date.now() + this.interval;
    }
    this.autoCall();
  }

  cancel() {
    clearTimeout(this.timeout!);
    this.timeout = null;
    this.call_func = null;
    this.next_time = null;
  }

  protected tryCall() {
    if (this.call_func) {
      this.call_func();
      this.call_func = null;
    }
  }

  protected autoCall() {
    if (this.next_time === null) {
      this.next_time = Date.now() + this.interval;
    }

    const now = Date.now();
    if (this.next_time > now) {
      clearTimeout(this.timeout!);
      this.timeout = setTimeout(() => {
        this.tryCall();
        this.timeout = null;
        this.next_time = Date.now() + this.interval;
      }, this.next_time - now);
    }

    if (this.next_time <= Date.now()) {
      clearTimeout(this.timeout!);
      this.timeout = null;
      this.tryCall();
      this.next_time = Date.now() + this.interval;
    }
  }
}

export class CallLock {
  protected state: boolean;
  private call_func: (() => unknown) | null = null;

  constructor(func: (...args: unknown[]) => unknown) {
    this.state = true;
    this.call_func = func;
  }

  lock() {
    this.state = false;
  }

  unlock() {
    this.state = true;
  }

  tryCall(lock = false) {
    if (this.call_func && this.state) {
      if (lock) this.lock();
      this.call_func();
    }
  }
}

export class CallInterval {
  private interval: number;
  private timeout: NodeJS.Timeout | null = null;
  private call_func: (() => unknown) | null = null;
  private prevent_call: boolean;

  constructor(interval: number);
  constructor(func: (...args: unknown[]) => unknown, interval: number);
  constructor(funcOrInterval: number | ((...args: unknown[]) => unknown), interval?: number) {
    if (typeof interval === "number") {
      this.interval = interval;
    }
    if (typeof funcOrInterval === "number") {
      this.interval = funcOrInterval;
    } else {
      this.call_func = funcOrInterval;
      this.interval = interval || 1000;
    }
    this.prevent_call = false;
  }

  setFunc(func: (...args: unknown[]) => unknown) {
    this.call_func = func;
  }

  private getIntervalTimer() {
    return setInterval(() => {
      if (this.call_func) {
        if (!this.prevent_call) this.call_func?.();
      }
    }, this.interval);
  }

  start() {
    this.prevent_call = false;
    if (this.timeout) return;
    this.timeout = this.getIntervalTimer();
  }

  pause() {
    this.prevent_call = true;
  }

  stop() {
    if (this.timeout) {
      clearInterval(this.timeout);
      this.timeout = null;
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  resetTime() {
    if (this.timeout) {
      clearInterval(this.timeout);
      this.timeout = this.getIntervalTimer();
    }
  }
}
