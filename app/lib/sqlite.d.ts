declare module "node:sqlite" {
  interface StatementResult {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: (string | number | null | bigint)[]): StatementResult;
    get(...params: (string | number | null | bigint)[]): unknown;
    all(...params: (string | number | null | bigint)[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
