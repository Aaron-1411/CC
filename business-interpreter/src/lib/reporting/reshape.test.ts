// Tests for the deterministic reshape engine. This is the app's trust anchor:
// every number it produces must come from this code, never a model — so it is
// covered exhaustively here. Zero external deps; runs under `bun test`.
import { describe, test, expect } from "bun:test";
import {
  parseCsv,
  toCsv,
  transpose,
  unpivot,
  pivot,
  groupBy,
  filter,
  sort,
  select,
  applyTransform,
  applyPipeline,
  previewTable,
  isAgg,
  isFilterOp,
  type Table,
} from "./reshape";

/* ------------------------------------------------------------------ */
/* parseCsv                                                            */
/* ------------------------------------------------------------------ */

describe("parseCsv", () => {
  test("basic header + rows with numeric coercion", () => {
    const t = parseCsv("a,b,c\n1,2,hello\n3,4,world");
    expect(t.columns).toEqual(["a", "b", "c"]);
    expect(t.rows).toEqual([
      [1, 2, "hello"],
      [3, 4, "world"],
    ]);
  });

  test("quoted fields with embedded commas and newlines", () => {
    const t = parseCsv('name,note\n"Smith, John","line1\nline2"\nDoe,plain');
    expect(t.columns).toEqual(["name", "note"]);
    expect(t.rows).toEqual([
      ["Smith, John", "line1\nline2"],
      ["Doe", "plain"],
    ]);
  });

  test('escaped quotes ("") inside quoted field', () => {
    const t = parseCsv('q\n"she said ""hi"""');
    expect(t.rows).toEqual([['she said "hi"']]);
  });

  test("CRLF and lone CR line endings", () => {
    const crlf = parseCsv("a,b\r\n1,2\r\n3,4");
    expect(crlf.rows).toEqual([
      [1, 2],
      [3, 4],
    ]);
    const cr = parseCsv("a,b\r1,2\r3,4");
    expect(cr.rows).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test("empty cells become null; blank headers get a generated name", () => {
    const t = parseCsv("a,,c\n1,,3");
    expect(t.columns).toEqual(["a", "column_2", "c"]);
    expect(t.rows).toEqual([[1, null, 3]]);
  });

  test("numbers with thousands separators are coerced; mixed tokens stay strings", () => {
    const t = parseCsv("amount,label\n\"1,234.5\",10kg");
    expect(t.rows).toEqual([[1234.5, "10kg"]]);
  });

  test("trailing fully-empty records are dropped", () => {
    const t = parseCsv("a,b\n1,2\n,\n\n");
    expect(t.rows).toEqual([[1, 2]]);
  });

  test("empty input yields empty table", () => {
    expect(parseCsv("")).toEqual({ columns: [], rows: [] });
  });

  test("short rows are padded with null to header width", () => {
    const t = parseCsv("a,b,c\n1");
    expect(t.rows).toEqual([[1, null, null]]);
  });
});

/* ------------------------------------------------------------------ */
/* toCsv (round-trip + escaping)                                       */
/* ------------------------------------------------------------------ */

describe("toCsv", () => {
  test("escapes commas, quotes and newlines; null becomes empty", () => {
    const t: Table = {
      columns: ["name", "note"],
      rows: [["Smith, John", 'say "hi"'], [null, "a\nb"]],
    };
    const csv = toCsv(t);
    expect(csv).toBe('name,note\r\n"Smith, John","say ""hi"""\r\n,"a\nb"');
  });

  test("round-trips through parseCsv", () => {
    const original: Table = {
      columns: ["x", "y"],
      rows: [
        [1, "a,b"],
        [2, 'c"d'],
      ],
    };
    expect(parseCsv(toCsv(original))).toEqual(original);
  });
});

/* ------------------------------------------------------------------ */
/* transpose                                                           */
/* ------------------------------------------------------------------ */

describe("transpose", () => {
  test("flips header row + data grid", () => {
    const t: Table = { columns: ["metric", "q1", "q2"], rows: [["rev", 10, 20]] };
    const out = transpose(t);
    expect(out.columns).toEqual(["metric", "rev"]);
    expect(out.rows).toEqual([
      ["q1", 10],
      ["q2", 20],
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* unpivot (wide → long)                                               */
/* ------------------------------------------------------------------ */

describe("unpivot", () => {
  const wide: Table = {
    columns: ["region", "q1", "q2"],
    rows: [
      ["North", 1, 2],
      ["South", 3, 4],
    ],
  };

  test("defaults value columns to everything not in idColumns", () => {
    const out = unpivot(wide, { idColumns: ["region"] });
    expect(out.columns).toEqual(["region", "variable", "value"]);
    expect(out.rows).toEqual([
      ["North", "q1", 1],
      ["North", "q2", 2],
      ["South", "q1", 3],
      ["South", "q2", 4],
    ]);
  });

  test("respects explicit value columns and custom names", () => {
    const out = unpivot(wide, {
      idColumns: ["region"],
      valueColumns: ["q2"],
      varName: "quarter",
      valueName: "sales",
    });
    expect(out.columns).toEqual(["region", "quarter", "sales"]);
    expect(out.rows).toEqual([
      ["North", "q2", 2],
      ["South", "q2", 4],
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* pivot (long → wide)                                                 */
/* ------------------------------------------------------------------ */

describe("pivot", () => {
  const long: Table = {
    columns: ["region", "quarter", "sales"],
    rows: [
      ["North", "q1", 10],
      ["North", "q2", 20],
      ["South", "q1", 5],
      ["North", "q1", 3], // duplicate (North,q1) → aggregated
    ],
  };

  test("sum is the default aggregation and order is first-seen", () => {
    const out = pivot(long, {
      indexColumns: ["region"],
      pivotColumn: "quarter",
      valueColumn: "sales",
    });
    expect(out.columns).toEqual(["region", "q1", "q2"]);
    expect(out.rows).toEqual([
      ["North", 13, 20], // 10 + 3 summed
      ["South", 5, null], // no q2 for South
    ]);
  });

  test("count / mean / first aggregations", () => {
    const count = pivot(long, {
      indexColumns: ["region"],
      pivotColumn: "quarter",
      valueColumn: "sales",
      agg: "count",
    });
    expect(count.rows).toEqual([
      ["North", 2, 1],
      ["South", 1, null],
    ]);
    const mean = pivot(long, {
      indexColumns: ["region"],
      pivotColumn: "quarter",
      valueColumn: "sales",
      agg: "mean",
    });
    expect(mean.rows[0]).toEqual(["North", 6.5, 20]); // (10+3)/2
    const first = pivot(long, {
      indexColumns: ["region"],
      pivotColumn: "quarter",
      valueColumn: "sales",
      agg: "first",
    });
    expect(first.rows[0]).toEqual(["North", 10, 20]);
  });
});

/* ------------------------------------------------------------------ */
/* groupBy (summarise)                                                 */
/* ------------------------------------------------------------------ */

describe("groupBy", () => {
  const t: Table = {
    columns: ["region", "rep", "sales"],
    rows: [
      ["North", "A", 10],
      ["South", "C", 5],
      ["North", "B", 40],
      ["South", "D", 50],
      ["North", "A", 3],
    ],
  };

  test("sums per group in first-seen order with default column names", () => {
    const out = groupBy(t, {
      groupColumns: ["region"],
      aggregations: [{ column: "sales", agg: "sum" }],
    });
    expect(out.columns).toEqual(["region", "sum_sales"]);
    expect(out.rows).toEqual([
      ["North", 53], // 10 + 40 + 3
      ["South", 55], // 5 + 50
    ]);
  });

  test("multiple aggregations and a custom output name", () => {
    const out = groupBy(t, {
      groupColumns: ["region"],
      aggregations: [
        { column: "sales", agg: "sum", as: "total" },
        { column: "sales", agg: "count" },
        { column: "sales", agg: "mean" },
        { column: "rep", agg: "first" },
      ],
    });
    expect(out.columns).toEqual(["region", "total", "count_sales", "mean_sales", "first_rep"]);
    expect(out.rows).toEqual([
      ["North", 53, 3, 53 / 3, "A"],
      ["South", 55, 2, 27.5, "C"],
    ]);
  });

  test("groups by a tuple of columns", () => {
    const out = groupBy(t, {
      groupColumns: ["region", "rep"],
      aggregations: [{ column: "sales", agg: "sum" }],
    });
    expect(out.columns).toEqual(["region", "rep", "sum_sales"]);
    expect(out.rows).toEqual([
      ["North", "A", 13], // 10 + 3
      ["South", "C", 5],
      ["North", "B", 40],
      ["South", "D", 50],
    ]);
  });

  test("min / max aggregations", () => {
    const out = groupBy(t, {
      groupColumns: ["region"],
      aggregations: [
        { column: "sales", agg: "min" },
        { column: "sales", agg: "max" },
      ],
    });
    expect(out.rows).toEqual([
      ["North", 3, 40],
      ["South", 5, 50],
    ]);
  });

  test("throws for an unknown group or aggregation column", () => {
    expect(() =>
      groupBy(t, { groupColumns: ["nope"], aggregations: [{ column: "sales", agg: "sum" }] }),
    ).toThrow(/column "nope" not found/);
    expect(() =>
      groupBy(t, { groupColumns: ["region"], aggregations: [{ column: "nope", agg: "sum" }] }),
    ).toThrow(/column "nope" not found/);
  });
});

/* ------------------------------------------------------------------ */
/* filter                                                              */
/* ------------------------------------------------------------------ */

describe("filter", () => {
  const t: Table = {
    columns: ["name", "age", "city"],
    rows: [
      ["Alice", 30, "London"],
      ["Bob", 25, ""],
      ["Carol", 40, "Leeds"],
      ["Dave", null, "London"],
    ],
  };

  test("numeric comparisons (gt / gte / lt / lte)", () => {
    expect(filter(t, { column: "age", op: "gt", value: "30" }).rows).toEqual([
      ["Carol", 40, "Leeds"],
    ]);
    expect(filter(t, { column: "age", op: "gte", value: "30" }).rows.map((r) => r[0])).toEqual([
      "Alice",
      "Carol",
    ]);
    expect(filter(t, { column: "age", op: "lt", value: "30" }).rows.map((r) => r[0])).toEqual([
      "Bob",
    ]);
    expect(filter(t, { column: "age", op: "lte", value: "30" }).rows.map((r) => r[0])).toEqual([
      "Alice",
      "Bob",
    ]);
  });

  test("eq / ne match numerically when both parse, else by string", () => {
    expect(filter(t, { column: "age", op: "eq", value: "40" }).rows.map((r) => r[0])).toEqual([
      "Carol",
    ]);
    expect(filter(t, { column: "name", op: "eq", value: "Bob" }).rows.map((r) => r[0])).toEqual([
      "Bob",
    ]);
    expect(filter(t, { column: "name", op: "ne", value: "Bob" }).rows.map((r) => r[0])).toEqual([
      "Alice",
      "Carol",
      "Dave",
    ]);
  });

  test("contains / notContains are case-insensitive", () => {
    expect(
      filter(t, { column: "city", op: "contains", value: "lon" }).rows.map((r) => r[0]),
    ).toEqual(["Alice", "Dave"]);
    expect(
      filter(t, { column: "city", op: "notContains", value: "lon" }).rows.map((r) => r[0]),
    ).toEqual(["Bob", "Carol"]); // empty city counts as notContains
  });

  test("isEmpty / notEmpty treat null and empty string as empty", () => {
    expect(filter(t, { column: "city", op: "isEmpty" }).rows.map((r) => r[0])).toEqual(["Bob"]);
    expect(filter(t, { column: "age", op: "isEmpty" }).rows.map((r) => r[0])).toEqual(["Dave"]);
    expect(filter(t, { column: "city", op: "notEmpty" }).rows.map((r) => r[0])).toEqual([
      "Alice",
      "Carol",
      "Dave",
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* sort                                                                */
/* ------------------------------------------------------------------ */

describe("sort", () => {
  const t: Table = {
    columns: ["name", "score"],
    rows: [
      ["Alice", 30],
      ["Bob", null],
      ["Carol", 5],
      ["Dave", 100],
    ],
  };

  test("ascending numeric, empties last", () => {
    expect(sort(t, { column: "score", direction: "asc" }).rows.map((r) => r[0])).toEqual([
      "Carol",
      "Alice",
      "Dave",
      "Bob", // null last
    ]);
  });

  test("descending numeric, empties STILL last", () => {
    expect(sort(t, { column: "score", direction: "desc" }).rows.map((r) => r[0])).toEqual([
      "Dave",
      "Alice",
      "Carol",
      "Bob", // null last regardless of direction
    ]);
  });

  test("string sort is numeric-aware (natural order)", () => {
    const s: Table = { columns: ["v"], rows: [["item10"], ["item2"], ["item1"]] };
    expect(sort(s, { column: "v" }).rows.map((r) => r[0])).toEqual(["item1", "item2", "item10"]);
  });

  test("default direction is ascending", () => {
    expect(sort(t, { column: "name" }).rows.map((r) => r[0])).toEqual([
      "Alice",
      "Bob",
      "Carol",
      "Dave",
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* select                                                              */
/* ------------------------------------------------------------------ */

describe("select", () => {
  const t: Table = {
    columns: ["a", "b", "c"],
    rows: [
      [1, 2, 3],
      [4, 5, 6],
    ],
  };

  test("keeps and reorders the chosen columns", () => {
    const out = select(t, { columns: ["c", "a"] });
    expect(out.columns).toEqual(["c", "a"]);
    expect(out.rows).toEqual([
      [3, 1],
      [6, 4],
    ]);
  });

  test("throws a helpful error for an unknown column", () => {
    expect(() => select(t, { columns: ["nope"] })).toThrow(/column "nope" not found/);
  });
});

/* ------------------------------------------------------------------ */
/* applyTransform / applyPipeline                                      */
/* ------------------------------------------------------------------ */

describe("applyTransform / applyPipeline", () => {
  const t: Table = {
    columns: ["region", "rep", "sales"],
    rows: [
      ["North", "A", 10],
      ["North", "B", 40],
      ["South", "C", 5],
      ["South", "D", 50],
    ],
  };

  test("op:none is a pass-through", () => {
    expect(applyTransform(t, { op: "none" })).toEqual(t);
  });

  test("chains filter → sort → select left-to-right", () => {
    const out = applyPipeline(t, [
      { op: "filter", params: { column: "sales", op: "gte", value: "10" } },
      { op: "sort", params: { column: "sales", direction: "desc" } },
      { op: "select", params: { columns: ["rep", "sales"] } },
    ]);
    expect(out.columns).toEqual(["rep", "sales"]);
    expect(out.rows).toEqual([
      ["D", 50],
      ["B", 40],
      ["A", 10],
    ]);
  });

  test("empty pipeline returns the input unchanged", () => {
    expect(applyPipeline(t, [])).toEqual(t);
  });
});

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

describe("guards & preview", () => {
  test("isAgg / isFilterOp recognise valid tokens only", () => {
    expect(isAgg("sum")).toBe(true);
    expect(isAgg("median")).toBe(false);
    expect(isFilterOp("contains")).toBe(true);
    expect(isFilterOp("matches")).toBe(false);
  });

  test("previewTable caps rows and columns", () => {
    const big: Table = {
      columns: Array.from({ length: 60 }, (_, i) => `c${i}`),
      rows: Array.from({ length: 150 }, () => Array.from({ length: 60 }, () => 0)),
    };
    const p = previewTable(big, 100, 50);
    expect(p.columns.length).toBe(50);
    expect(p.rows.length).toBe(100);
    expect(p.rows[0].length).toBe(50);
  });
});
