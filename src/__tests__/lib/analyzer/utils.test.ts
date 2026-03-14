import { describe, it, expect } from "vitest";
import { stripComments, mapFunctions } from "@/lib/analyzer/utils";

describe("stripComments", () => {
  it("removes single-line // comments", () => {
    expect(stripComments("code // comment")).toBe("code ");
  });

  it("removes FunC single-line ;; comments", () => {
    expect(stripComments("code ;; comment")).toBe("code ");
  });

  it("removes multi-line /* */ comments", () => {
    expect(stripComments("before /* comment */ after")).toBe("before  after");
  });

  it("removes FunC multi-line {- -} comments", () => {
    expect(stripComments("before {- comment -} after")).toBe("before  after");
  });

  it("handles code with no comments", () => {
    expect(stripComments("int x = 5;")).toBe("int x = 5;");
  });

  it("handles multi-line comment spanning multiple lines", () => {
    const input = "line1\n/* start\nmiddle\nend */\nline5";
    const result = stripComments(input);
    expect(result).toBe("line1\n\nline5");
  });
});

describe("mapFunctions", () => {
  it("detects a simple FunC function", () => {
    const code = `() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg_body) {
  ;; body
}`;
    const funcs = mapFunctions(code);
    expect(funcs).toHaveLength(1);
    expect(funcs[0].name).toBe("recv_internal");
    expect(funcs[0].startLine).toBe(1);
    expect(funcs[0].endLine).toBe(3);
  });

  it("detects multiple functions", () => {
    const code = `int sum(int a, int b) {
  return a + b;
}

() main() {
  int x = sum(1, 2);
}`;
    const funcs = mapFunctions(code);
    expect(funcs.length).toBeGreaterThanOrEqual(2);
    const names = funcs.map((f) => f.name);
    expect(names).toContain("sum");
    expect(names).toContain("main");
  });

  it("returns empty array for code without functions", () => {
    const code = "int x = 5;\nint y = 10;";
    const funcs = mapFunctions(code);
    expect(funcs).toHaveLength(0);
  });

  it("handles nested braces correctly", () => {
    const code = `() handler() {
  if (x) {
    do_thing();
  }
}`;
    const funcs = mapFunctions(code);
    expect(funcs).toHaveLength(1);
    expect(funcs[0].name).toBe("handler");
    expect(funcs[0].endLine).toBe(5);
  });

  it("ignores comments when parsing", () => {
    const code = `() real_func() {
  ;; int fake(int x) {
  int y = 1;
}`;
    const funcs = mapFunctions(code);
    expect(funcs).toHaveLength(1);
    expect(funcs[0].name).toBe("real_func");
  });
});
