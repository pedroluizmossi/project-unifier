declare module 'picomatch' {
  interface PicomatchOptions {
    dot?: boolean;
    noglobstar?: boolean;
    [key: string]: any;
  }

  function isMatch(str: string, pattern: string, options?: PicomatchOptions): boolean;

  export = { isMatch };
}
