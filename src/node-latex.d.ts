declare module 'node-latex' {
  import { Readable, Writable } from 'stream';

  interface Options {
    cmd?: string;
    args?: string[];
    errorLogs?: Writable;
    inputs?: string | string[];
    fonts?: string | string[];
    maxBuffer?: number;
  }

  function latex(
    input: Readable,
    options?: Options
  ): Readable;

  export = latex;
}
