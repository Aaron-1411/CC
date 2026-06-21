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
  derive,
  limit,
  rename,
  dedupe,
  fillDown,
  castNumber,
  trim,
  splitColumn,
  mergeColumns,
  replace,
  dateExtract,
  round,
  percentOfTotal,
  runningTotal,
  rank,
  difference,
  movingAverage,
  bin,
  fxNormalize,
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

  test("median / last / countDistinct aggregations", () => {
    const out = groupBy(t, {
      groupColumns: ["region"],
      aggregations: [
        { column: "sales", agg: "median" },
        { column: "rep", agg: "last" },
        { column: "rep", agg: "countDistinct", as: "distinct_reps" },
      ],
    });
    expect(out.columns).toEqual(["region", "median_sales", "last_rep", "distinct_reps"]);
    expect(out.rows).toEqual([
      ["North", 10, "A", 2], // sales [10,40,3] → median 10; reps A,B,A → last A, distinct 2
      ["South", 27.5, "D", 2], // sales [5,50] → mean of middles 27.5; reps C,D → last D, distinct 2
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
/* derive                                                              */
/* ------------------------------------------------------------------ */

describe("derive", () => {
  const t: Table = {
    columns: ["product", "revenue", "cost"],
    rows: [
      ["A", 100, 60],
      ["B", 50, 50],
      ["C", "n/a", 10],
    ],
  };

  test("subtracts one column from another into a new column", () => {
    const out = derive(t, {
      as: "margin",
      left: "revenue",
      operator: "-",
      rightKind: "column",
      right: "cost",
    });
    expect(out.columns).toEqual(["product", "revenue", "cost", "margin"]);
    expect(out.rows).toEqual([
      ["A", 100, 60, 40],
      ["B", 50, 50, 0],
      ["C", "n/a", 10, null], // non-numeric left → null
    ]);
  });

  test("scales by a constant", () => {
    const out = derive(t, {
      as: "rev_pct",
      left: "revenue",
      operator: "*",
      rightKind: "const",
      right: "100",
    });
    expect(out.rows.map((r) => r[3])).toEqual([10000, 5000, null]);
  });

  test("divide-by-zero yields null, normal division works", () => {
    const d: Table = {
      columns: ["a", "b"],
      rows: [
        [10, 2],
        [10, 0],
      ],
    };
    const out = derive(d, { as: "ratio", left: "a", operator: "/", rightKind: "column", right: "b" });
    expect(out.rows.map((r) => r[2])).toEqual([5, null]);
  });

  test("overwrites an existing column when `as` matches", () => {
    const out = derive(t, {
      as: "cost",
      left: "cost",
      operator: "+",
      rightKind: "const",
      right: "5",
    });
    expect(out.columns).toEqual(["product", "revenue", "cost"]);
    expect(out.rows).toEqual([
      ["A", 100, 65],
      ["B", 50, 55],
      ["C", "n/a", 15],
    ]);
  });

  test("throws for unknown columns, an empty name, or a non-numeric constant", () => {
    expect(() =>
      derive(t, { as: "x", left: "nope", operator: "+", rightKind: "const", right: "1" }),
    ).toThrow(/column "nope" not found/);
    expect(() =>
      derive(t, { as: "x", left: "revenue", operator: "+", rightKind: "column", right: "nope" }),
    ).toThrow(/column "nope" not found/);
    expect(() =>
      derive(t, { as: "  ", left: "revenue", operator: "+", rightKind: "const", right: "1" }),
    ).toThrow(/output column name is required/);
    expect(() =>
      derive(t, { as: "x", left: "revenue", operator: "+", rightKind: "const", right: "abc" }),
    ).toThrow(/is not a number/);
  });
});

/* ------------------------------------------------------------------ */
/* limit                                                               */
/* ------------------------------------------------------------------ */

describe("limit", () => {
  const t: Table = {
    columns: ["name", "score"],
    rows: [
      ["A", 10],
      ["B", 20],
      ["C", 30],
      ["D", 40],
    ],
  };

  test("keeps the first N rows", () => {
    const out = limit(t, { count: 2 });
    expect(out.columns).toEqual(["name", "score"]);
    expect(out.rows).toEqual([
      ["A", 10],
      ["B", 20],
    ]);
  });

  test("count larger than the table keeps every row", () => {
    expect(limit(t, { count: 99 }).rows).toEqual(t.rows);
  });

  test("count 0 keeps no rows but preserves columns", () => {
    const out = limit(t, { count: 0 });
    expect(out.columns).toEqual(["name", "score"]);
    expect(out.rows).toEqual([]);
  });

  test("offset skips rows from the top before keeping", () => {
    const out = limit(t, { count: 2, offset: 1 });
    expect(out.rows).toEqual([
      ["B", 20],
      ["C", 30],
    ]);
  });

  test("offset past the end yields no rows", () => {
    expect(limit(t, { count: 5, offset: 10 }).rows).toEqual([]);
  });

  test("does not mutate the source rows", () => {
    const before = t.rows.length;
    limit(t, { count: 1 });
    expect(t.rows.length).toBe(before);
  });

  test("pairs with sort for a top-N report", () => {
    const out = applyPipeline(t, [
      { op: "sort", params: { column: "score", direction: "desc" } },
      { op: "limit", params: { count: 2 } },
    ]);
    expect(out.rows).toEqual([
      ["D", 40],
      ["C", 30],
    ]);
  });

  test("throws for a negative count", () => {
    expect(() => limit(t, { count: -1 })).toThrow(/non-negative/);
  });
});

/* ------------------------------------------------------------------ */
/* rename                                                              */
/* ------------------------------------------------------------------ */

describe("rename", () => {
  const t: Table = {
    columns: ["name", "score"],
    rows: [
      ["A", 10],
      ["B", 20],
    ],
  };

  test("renames a single column and leaves rows untouched", () => {
    const out = rename(t, { renames: [{ from: "score", to: "points" }] });
    expect(out.columns).toEqual(["name", "points"]);
    expect(out.rows).toEqual(t.rows);
  });

  test("renames several columns in one pass", () => {
    const out = rename(t, {
      renames: [
        { from: "name", to: "player" },
        { from: "score", to: "points" },
      ],
    });
    expect(out.columns).toEqual(["player", "points"]);
  });

  test("trims whitespace from the new name", () => {
    const out = rename(t, { renames: [{ from: "score", to: "  points  " }] });
    expect(out.columns).toEqual(["name", "points"]);
  });

  test("does not mutate the source columns", () => {
    rename(t, { renames: [{ from: "score", to: "points" }] });
    expect(t.columns).toEqual(["name", "score"]);
  });

  test("returns the table unchanged when there are no renames", () => {
    const out = rename(t, { renames: [] });
    expect(out).toBe(t);
  });

  test("throws when the source column is missing", () => {
    expect(() => rename(t, { renames: [{ from: "nope", to: "x" }] })).toThrow(/not found/);
  });

  test("throws when the new name is blank", () => {
    expect(() => rename(t, { renames: [{ from: "score", to: "   " }] })).toThrow(/new column name/);
  });

  test("chains through applyPipeline after a compute step", () => {
    const out = applyPipeline(t, [
      { op: "rename", params: { renames: [{ from: "score", to: "points" }] } },
    ]);
    expect(out.columns).toEqual(["name", "points"]);
  });
});

/* ------------------------------------------------------------------ */
/* dedupe                                                              */
/* ------------------------------------------------------------------ */

describe("dedupe", () => {
  const t: Table = {
    columns: ["region", "product", "units"],
    rows: [
      ["North", "Widget", 10],
      ["North", "Widget", 10],
      ["South", "Widget", 10],
      ["North", "Gadget", 5],
      ["South", "Widget", 10],
    ],
  };

  test("drops fully-duplicate rows, keeping the first occurrence and order", () => {
    const out = dedupe(t, {});
    expect(out.columns).toEqual(["region", "product", "units"]);
    expect(out.rows).toEqual([
      ["North", "Widget", 10],
      ["South", "Widget", 10],
      ["North", "Gadget", 5],
    ]);
  });

  test("treats omitted columns the same as whole-row dedupe", () => {
    expect(dedupe(t).rows).toEqual(dedupe(t, { columns: [] }).rows);
  });

  test("dedupes on a subset of columns only", () => {
    const out = dedupe(t, { columns: ["region"] });
    expect(out.rows).toEqual([
      ["North", "Widget", 10],
      ["South", "Widget", 10],
    ]);
  });

  test("dedupes on multiple subset columns", () => {
    const out = dedupe(t, { columns: ["region", "product"] });
    expect(out.rows).toEqual([
      ["North", "Widget", 10],
      ["South", "Widget", 10],
      ["North", "Gadget", 5],
    ]);
  });

  test("ignores blank/whitespace column names in the subset", () => {
    const out = dedupe(t, { columns: ["region", "  "] });
    expect(out.rows).toEqual([
      ["North", "Widget", 10],
      ["South", "Widget", 10],
    ]);
  });

  test("does not collapse distinct types (number 1 vs string '1')", () => {
    const typed: Table = {
      columns: ["v"],
      rows: [[1], ["1"], [1], [null]],
    };
    const out = dedupe(typed, {});
    expect(out.rows).toEqual([[1], ["1"], [null]]);
  });

  test("does not mutate the source rows", () => {
    const before = t.rows.length;
    dedupe(t, {});
    expect(t.rows.length).toBe(before);
  });

  test("throws when a subset column is missing", () => {
    expect(() => dedupe(t, { columns: ["nope"] })).toThrow(/not found/);
  });

  test("chains through applyPipeline", () => {
    const out = applyPipeline(t, [{ op: "dedupe", params: { columns: ["region"] } }]);
    expect(out.rows).toEqual([
      ["North", "Widget", 10],
      ["South", "Widget", 10],
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* fillDown                                                            */
/* ------------------------------------------------------------------ */

describe("fillDown", () => {
  const t: Table = {
    columns: ["region", "product", "units"],
    rows: [
      ["North", "Widget", 10],
      ["", "Gadget", 5],
      [null, "Gizmo", 3],
      ["South", "Widget", 7],
      ["", "Gadget", 2],
    ],
  };

  test("forward-fills blank and null cells with the value above, keeping order", () => {
    const out = fillDown(t, {});
    expect(out.columns).toEqual(["region", "product", "units"]);
    expect(out.rows).toEqual([
      ["North", "Widget", 10],
      ["North", "Gadget", 5],
      ["North", "Gizmo", 3],
      ["South", "Widget", 7],
      ["South", "Gadget", 2],
    ]);
  });

  test("treats omitted columns the same as filling every column", () => {
    expect(fillDown(t).rows).toEqual(fillDown(t, { columns: [] }).rows);
  });

  test("fills only the selected subset of columns", () => {
    const partial: Table = {
      columns: ["a", "b"],
      rows: [
        ["x", "1"],
        ["", ""],
        ["y", ""],
      ],
    };
    const out = fillDown(partial, { columns: ["a"] });
    expect(out.rows).toEqual([
      ["x", "1"],
      ["x", ""],
      ["y", ""],
    ]);
  });

  test("leaves leading blanks blank when nothing is above", () => {
    const leading: Table = {
      columns: ["a"],
      rows: [[""], [null], ["v"], [""]],
    };
    const out = fillDown(leading, {});
    expect(out.rows).toEqual([[""], [null], ["v"], ["v"]]);
  });

  test("treats both empty string and null as blank", () => {
    const mixed: Table = {
      columns: ["a"],
      rows: [["v"], [""], [null], ["w"]],
    };
    const out = fillDown(mixed, {});
    expect(out.rows).toEqual([["v"], ["v"], ["v"], ["w"]]);
  });

  test("does not treat 0 or false as blank", () => {
    const falsy: Table = {
      columns: ["a"],
      rows: [[0], [""], [false], [null]],
    };
    const out = fillDown(falsy, {});
    expect(out.rows).toEqual([[0], [0], [false], [false]]);
  });

  test("does not mutate the source rows", () => {
    const snapshot = JSON.parse(JSON.stringify(t.rows));
    fillDown(t, {});
    expect(t.rows).toEqual(snapshot);
  });

  test("throws when a subset column is missing", () => {
    expect(() => fillDown(t, { columns: ["nope"] })).toThrow(/not found/);
  });

  test("chains through applyPipeline", () => {
    const out = applyPipeline(t, [{ op: "fillDown", params: { columns: ["region"] } }]);
    expect(out.rows).toEqual([
      ["North", "Widget", 10],
      ["North", "Gadget", 5],
      ["North", "Gizmo", 3],
      ["South", "Widget", 7],
      ["South", "Gadget", 2],
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* castNumber                                                          */
/* ------------------------------------------------------------------ */

describe("castNumber", () => {
  const t: Table = {
    columns: ["label", "amount"],
    rows: [
      ["A", "$1,234.50"],
      ["B", "45%"],
      ["C", "(1,000)"],
      ["D", "-12"],
      ["E", ""],
      ["F", "n/a"],
    ],
  };

  test("strips currency symbols and thousands commas", () => {
    const out = castNumber(t, { columns: ["amount"] });
    expect(out.rows[0]).toEqual(["A", 1234.5]);
  });

  test("strips a trailing percent sign to a bare number", () => {
    const out = castNumber(t, { columns: ["amount"] });
    expect(out.rows[1]).toEqual(["B", 45]);
  });

  test("treats accounting parentheses as negative", () => {
    const out = castNumber(t, { columns: ["amount"] });
    expect(out.rows[2]).toEqual(["C", -1000]);
  });

  test("parses a leading minus sign", () => {
    const out = castNumber(t, { columns: ["amount"] });
    expect(out.rows[3]).toEqual(["D", -12]);
  });

  test("blank cells become null", () => {
    const out = castNumber(t, { columns: ["amount"] });
    expect(out.rows[4]).toEqual(["E", null]);
  });

  test("unparseable cells become null by default", () => {
    const out = castNumber(t, { columns: ["amount"] });
    expect(out.rows[5]).toEqual(["F", null]);
  });

  test("unparseable cells are kept when onError is 'keep'", () => {
    const out = castNumber(t, { columns: ["amount"], onError: "keep" });
    expect(out.rows[5]).toEqual(["F", "n/a"]);
  });

  test("only converts the selected columns, leaving others untouched", () => {
    const out = castNumber(t, { columns: ["amount"] });
    expect(out.columns).toEqual(["label", "amount"]);
    expect(out.rows.map((r) => r[0])).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  test("booleans become null", () => {
    const bt: Table = { columns: ["x"], rows: [[true], [false]] };
    const out = castNumber(bt, { columns: ["x"] });
    expect(out.rows).toEqual([[null], [null]]);
  });

  test("passes through values that are already numbers", () => {
    const nt: Table = { columns: ["x"], rows: [[10], [3.5]] };
    const out = castNumber(nt, { columns: ["x"] });
    expect(out.rows).toEqual([[10], [3.5]]);
  });

  test("does not mutate the source rows", () => {
    const snapshot = JSON.parse(JSON.stringify(t.rows));
    castNumber(t, { columns: ["amount"] });
    expect(t.rows).toEqual(snapshot);
  });

  test("throws when a column is missing", () => {
    expect(() => castNumber(t, { columns: ["nope"] })).toThrow(/not found/);
  });

  test("chains through applyPipeline (cast then sum)", () => {
    const out = applyPipeline(t, [
      { op: "castNumber", params: { columns: ["amount"], onError: "null" } },
      {
        op: "groupBy",
        params: { groupColumns: [], aggregations: [{ column: "amount", agg: "sum", as: "total" }] },
      },
    ]);
    // 1234.5 + 45 + (-1000) + (-12) = 267.5 ; blanks/unparseable ignored by sum
    expect(out.rows[0]).toEqual([267.5]);
  });
});

/* ------------------------------------------------------------------ */
/* trim                                                                */
/* ------------------------------------------------------------------ */

describe("trim", () => {
  const t: Table = {
    columns: ["region", "city", "n"],
    rows: [
      ["  North ", "  Leeds", 1],
      ["North", "York  ", 2],
      [" South\t", "Hull", 3],
    ],
  };

  test("strips leading and trailing whitespace on all columns by default", () => {
    const out = trim(t);
    expect(out.rows).toEqual([
      ["North", "Leeds", 1],
      ["North", "York", 2],
      ["South", "Hull", 3],
    ]);
  });

  test("omitted columns equals empty columns equals all columns", () => {
    expect(trim(t).rows).toEqual(trim(t, { columns: [] }).rows);
  });

  test("restricts to a subset of columns when given", () => {
    const out = trim(t, { columns: ["region"] });
    // city left untouched
    expect(out.rows).toEqual([
      ["North", "  Leeds", 1],
      ["North", "York  ", 2],
      ["South", "Hull", 3],
    ]);
  });

  test("collapse reduces internal whitespace runs to a single space", () => {
    const inner: Table = {
      columns: ["x"],
      rows: [["  a   b\t\tc  "], ["one    two"]],
    };
    const out = trim(inner, { collapse: true });
    expect(out.rows).toEqual([["a b c"], ["one two"]]);
  });

  test("default (no collapse) leaves internal whitespace intact", () => {
    const inner: Table = { columns: ["x"], rows: [["  a   b  "]] };
    expect(trim(inner).rows).toEqual([["a   b"]]);
  });

  test("leaves numbers, booleans and null untouched", () => {
    const mixed: Table = {
      columns: ["a", "b", "c"],
      rows: [[42, true, null]],
    };
    const out = trim(mixed);
    expect(out.rows).toEqual([[42, true, null]]);
  });

  test("does not mutate the source table", () => {
    const snapshot = JSON.stringify(t);
    trim(t, { collapse: true });
    expect(JSON.stringify(t)).toEqual(snapshot);
  });

  test("throws on a missing subset column", () => {
    expect(() => trim(t, { columns: ["nope"] })).toThrow(/not found/);
  });

  test("chains through applyPipeline to merge ' North ' and 'North' in group by", () => {
    const out = applyPipeline(t, [
      { op: "trim", params: { columns: ["region"] } },
      {
        op: "groupBy",
        params: {
          groupColumns: ["region"],
          aggregations: [{ column: "n", agg: "sum", as: "total" }],
        },
      },
    ]);
    // "  North " + "North" collapse to one group summing 1 + 2 = 3
    const north = out.rows.find((r) => r[0] === "North");
    expect(north).toEqual(["North", 3]);
  });
});

/* ------------------------------------------------------------------ */
/* splitColumn                                                         */
/* ------------------------------------------------------------------ */

describe("splitColumn", () => {
  const t: Table = {
    columns: ["id", "place"],
    rows: [
      [1, "Leeds, West Yorkshire"],
      [2, "York, North Yorkshire"],
    ],
  };

  test("auto-names columns to the widest row and splits on the literal delimiter", () => {
    const out = splitColumn(t, { column: "place", delimiter: ", " });
    expect(out.columns).toEqual(["id", "place 1", "place 2"]);
    expect(out.rows).toEqual([
      [1, "Leeds", "West Yorkshire"],
      [2, "York", "North Yorkshire"],
    ]);
  });

  test("splices new columns in at the source column's position", () => {
    const wide: Table = {
      columns: ["a", "place", "z"],
      rows: [["x", "Leeds-LS1", "y"]],
    };
    const out = splitColumn(wide, { column: "place", delimiter: "-" });
    expect(out.columns).toEqual(["a", "place 1", "place 2", "z"]);
    expect(out.rows).toEqual([["x", "Leeds", "LS1", "y"]]);
  });

  test("auto-naming pads short rows with null up to the widest row", () => {
    const ragged: Table = {
      columns: ["v"],
      rows: [["a-b-c"], ["d-e"], ["f"]],
    };
    const out = splitColumn(ragged, { column: "v", delimiter: "-" });
    expect(out.columns).toEqual(["v 1", "v 2", "v 3"]);
    expect(out.rows).toEqual([
      ["a", "b", "c"],
      ["d", "e", null],
      ["f", null, null],
    ]);
  });

  test("explicit `into` pins the column count and pads short rows with null", () => {
    const ragged: Table = { columns: ["v"], rows: [["a-b"], ["c"]] };
    const out = splitColumn(ragged, { column: "v", delimiter: "-", into: ["first", "second"] });
    expect(out.columns).toEqual(["first", "second"]);
    expect(out.rows).toEqual([
      ["a", "b"],
      ["c", null],
    ]);
  });

  test("explicit `into` rejoins overflow parts into the last named column", () => {
    const t2: Table = { columns: ["name"], rows: [["Doe, John, Q."]] };
    const out = splitColumn(t2, { column: "name", delimiter: ", ", into: ["last", "rest"] });
    expect(out.columns).toEqual(["last", "rest"]);
    expect(out.rows).toEqual([["Doe", "John, Q."]]);
  });

  test("non-string cells keep their value in the first slot with nulls elsewhere", () => {
    const mixed: Table = {
      columns: ["v"],
      rows: [["a-b"], [42], [true], [null]],
    };
    const out = splitColumn(mixed, { column: "v", delimiter: "-" });
    expect(out.columns).toEqual(["v 1", "v 2"]);
    expect(out.rows).toEqual([
      ["a", "b"],
      [42, null],
      [true, null],
      [null, null],
    ]);
  });

  test("keepOriginal keeps the source column alongside the new ones", () => {
    const out = splitColumn(t, { column: "place", delimiter: ", ", keepOriginal: true });
    expect(out.columns).toEqual(["id", "place", "place 1", "place 2"]);
    expect(out.rows[0]).toEqual([1, "Leeds, West Yorkshire", "Leeds", "West Yorkshire"]);
  });

  test("throws on an empty delimiter", () => {
    expect(() => splitColumn(t, { column: "place", delimiter: "" })).toThrow(/delimiter/);
  });

  test("throws on a missing column", () => {
    expect(() => splitColumn(t, { column: "nope", delimiter: "," })).toThrow(/not found/);
  });

  test("does not mutate the source table", () => {
    const snapshot = JSON.stringify(t);
    splitColumn(t, { column: "place", delimiter: ", ", keepOriginal: true });
    expect(JSON.stringify(t)).toEqual(snapshot);
  });

  test("chains through applyPipeline (split → trim → groupBy)", () => {
    const sales: Table = {
      columns: ["place", "amount"],
      rows: [
        ["Leeds , North", 10],
        ["York , North", 5],
        ["Hull , North", 7],
      ],
    };
    const out = applyPipeline(sales, [
      { op: "splitColumn", params: { column: "place", delimiter: ",", into: ["city", "region"] } },
      { op: "trim", params: { columns: ["region"] } },
      {
        op: "groupBy",
        params: {
          groupColumns: ["region"],
          aggregations: [{ column: "amount", agg: "sum", as: "total" }],
        },
      },
    ]);
    const north = out.rows.find((r) => r[0] === "North");
    expect(north).toEqual(["North", 22]);
  });
});

/* ------------------------------------------------------------------ */
/* mergeColumns                                                        */
/* ------------------------------------------------------------------ */

describe("mergeColumns", () => {
  const t: Table = {
    columns: ["first", "last", "age"],
    rows: [
      ["Aaron", "Manu", 30],
      ["Jane", "Doe", 25],
    ],
  };

  test("merges two columns into one at the first source position", () => {
    const out = mergeColumns(t, { columns: ["first", "last"], separator: " ", into: "name" });
    expect(out.columns).toEqual(["name", "age"]);
    expect(out.rows).toEqual([
      ["Aaron Manu", 30],
      ["Jane Doe", 25],
    ]);
  });

  test("stringifies numbers/booleans and treats null as empty", () => {
    const nums: Table = {
      columns: ["a", "b", "c"],
      rows: [
        ["x", 5, true],
        ["y", null, false],
      ],
    };
    const out = mergeColumns(nums, { columns: ["a", "b", "c"], separator: "-", into: "joined" });
    expect(out.columns).toEqual(["joined"]);
    expect(out.rows).toEqual([["x-5-true"], ["y--false"]]);
  });

  test("skipEmpty drops null/empty cells before joining", () => {
    const nums: Table = {
      columns: ["a", "b", "c"],
      rows: [
        ["x", 5, "z"],
        ["y", null, ""],
      ],
    };
    const out = mergeColumns(nums, {
      columns: ["a", "b", "c"],
      separator: "-",
      into: "joined",
      skipEmpty: true,
    });
    expect(out.rows).toEqual([["x-5-z"], ["y"]]);
  });

  test("keepOriginals preserves source columns alongside the merged result", () => {
    const out = mergeColumns(t, {
      columns: ["first", "last"],
      separator: " ",
      into: "name",
      keepOriginals: true,
    });
    expect(out.columns).toEqual(["first", "name", "last", "age"]);
    expect(out.rows[0]).toEqual(["Aaron", "Aaron Manu", "Manu", 30]);
  });

  test("an empty separator concatenates with no gap", () => {
    const out = mergeColumns(t, { columns: ["first", "last"], separator: "", into: "name" });
    expect(out.rows[0]).toEqual(["AaronManu", 30]);
  });

  test("joins in the given column order but inserts at the lowest source index", () => {
    const out = mergeColumns(t, { columns: ["last", "first"], separator: ", ", into: "name" });
    expect(out.columns).toEqual(["name", "age"]);
    expect(out.rows[0]).toEqual(["Manu, Aaron", 30]);
  });

  test("merges three columns and keeps the rest", () => {
    const addr: Table = {
      columns: ["street", "city", "postcode", "country"],
      rows: [["1 High St", "Leeds", "LS1", "UK"]],
    };
    const out = mergeColumns(addr, {
      columns: ["street", "city", "postcode"],
      separator: ", ",
      into: "address",
    });
    expect(out.columns).toEqual(["address", "country"]);
    expect(out.rows[0]).toEqual(["1 High St, Leeds, LS1", "UK"]);
  });

  test("throws on a missing column", () => {
    expect(() => mergeColumns(t, { columns: ["first", "nope"], separator: " ", into: "x" })).toThrow(
      /not found/,
    );
  });

  test("throws when no columns are given", () => {
    expect(() => mergeColumns(t, { columns: [], separator: " ", into: "x" })).toThrow(/at least one/);
  });

  test("does not mutate the source table", () => {
    const snapshot = JSON.stringify(t);
    mergeColumns(t, { columns: ["first", "last"], separator: " ", into: "name", keepOriginals: true });
    expect(JSON.stringify(t)).toEqual(snapshot);
  });

  test("round-trips with splitColumn (merge → split back)", () => {
    const out = applyPipeline(t, [
      { op: "mergeColumns", params: { columns: ["first", "last"], separator: ", ", into: "name" } },
      { op: "splitColumn", params: { column: "name", delimiter: ", ", into: ["first", "last"] } },
    ]);
    expect(out.columns).toEqual(["first", "last", "age"]);
    expect(out.rows[0]).toEqual(["Aaron", "Manu", 30]);
  });

  test("chains through applyPipeline (merge → sort)", () => {
    const sales: Table = {
      columns: ["region", "rep", "amount"],
      rows: [
        ["South", "C", 7],
        ["North", "B", 5],
        ["North", "A", 10],
      ],
    };
    const out = applyPipeline(sales, [
      { op: "mergeColumns", params: { columns: ["region", "rep"], separator: " / ", into: "key" } },
      { op: "sort", params: { column: "key", direction: "asc" } },
    ]);
    expect(out.columns).toEqual(["key", "amount"]);
    expect(out.rows.map((r) => r[0])).toEqual(["North / A", "North / B", "South / C"]);
  });
});

describe("replace", () => {
  const t: Table = {
    columns: ["country", "note", "amount"],
    rows: [
      ["USA", "n/a", 10],
      ["usa", "N/A", 20],
      ["Canada", "ok", 30],
    ],
  };

  test("substring replace is case-insensitive by default", () => {
    const out = replace(t, { columns: ["country"], find: "usa", replace: "United States" });
    expect(out.columns).toEqual(["country", "note", "amount"]);
    expect(out.rows.map((r) => r[0])).toEqual(["United States", "United States", "Canada"]);
    // other columns untouched
    expect(out.rows.map((r) => r[1])).toEqual(["n/a", "N/A", "ok"]);
  });

  test("matchCase only replaces exact-case occurrences", () => {
    const out = replace(t, { columns: ["country"], find: "usa", replace: "X", matchCase: true });
    expect(out.rows.map((r) => r[0])).toEqual(["USA", "X", "Canada"]);
  });

  test("wholeCell replaces only when the whole cell matches (case-insensitive)", () => {
    const data: Table = {
      columns: ["c"],
      rows: [["N/A"], ["n/a"], ["see N/A note"], ["ok"]],
    };
    const out = replace(data, { find: "n/a", replace: "", wholeCell: true });
    expect(out.rows.map((r) => r[0])).toEqual(["", "", "see N/A note", "ok"]);
  });

  test("wholeCell honours matchCase", () => {
    const data: Table = { columns: ["c"], rows: [["N/A"], ["n/a"]] };
    const out = replace(data, { find: "N/A", replace: "", wholeCell: true, matchCase: true });
    expect(out.rows.map((r) => r[0])).toEqual(["", "n/a"]);
  });

  test("replace defaults to empty string (deletes the match)", () => {
    const data: Table = { columns: ["c"], rows: [["foo-bar"], ["bar"]] };
    const out = replace(data, { find: "bar" });
    expect(out.rows.map((r) => r[0])).toEqual(["foo-", ""]);
  });

  test("only string cells are touched; numbers/booleans/nulls pass through", () => {
    const data: Table = {
      columns: ["a"],
      rows: [["10"], [10], [true], [null]],
    };
    const out = replace(data, { find: "10", replace: "X" });
    expect(out.rows.map((r) => r[0])).toEqual(["X", 10, true, null]);
  });

  test("omitting columns applies to every column", () => {
    const data: Table = {
      columns: ["a", "b"],
      rows: [
        ["x", "x"],
        ["y", "x"],
      ],
    };
    const out = replace(data, { find: "x", replace: "Z" });
    expect(out.rows).toEqual([
      ["Z", "Z"],
      ["y", "Z"],
    ]);
  });

  test("find is treated literally — regex-special characters are escaped", () => {
    const data: Table = { columns: ["c"], rows: [["a.b.c"], ["axbxc"]] };
    const out = replace(data, { find: ".", replace: "-" });
    expect(out.rows.map((r) => r[0])).toEqual(["a-b-c", "axbxc"]);
  });

  test("replacement text is literal — $& and $1 are not expanded", () => {
    const data: Table = { columns: ["c"], rows: [["hello"]] };
    const out = replace(data, { find: "hello", replace: "$& $1 done" });
    expect(out.rows.map((r) => r[0])).toEqual(["$& $1 done"]);
  });

  test("empty find throws", () => {
    expect(() => replace(t, { find: "" })).toThrow(/provide text to find/);
  });

  test("unknown column throws", () => {
    expect(() => replace(t, { columns: ["nope"], find: "x" })).toThrow(/not found/);
  });

  test("does not mutate the input table", () => {
    const data: Table = { columns: ["c"], rows: [["x"]] };
    const snapshot = JSON.parse(JSON.stringify(data));
    replace(data, { find: "x", replace: "y" });
    expect(data).toEqual(snapshot);
  });

  test("chains through applyPipeline", () => {
    const out = applyPipeline(t, [
      { op: "replace", params: { columns: ["country"], find: "usa", replace: "US" } },
      { op: "replace", params: { columns: ["note"], find: "n/a", replace: "", wholeCell: true } },
    ]);
    expect(out.rows.map((r) => r[0])).toEqual(["US", "US", "Canada"]);
    expect(out.rows.map((r) => r[1])).toEqual(["", "", "ok"]);
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

  test("chains derive → groupBy → sort with default agg naming", () => {
    const out = applyPipeline(t, [
      { op: "derive", params: { as: "net", left: "sales", operator: "*", rightKind: "const", right: "2" } },
      {
        op: "groupBy",
        params: {
          groupColumns: ["region"],
          aggregations: [{ column: "net", agg: "sum" }],
        },
      },
      { op: "sort", params: { column: "sum_net", direction: "desc" } },
    ]);
    expect(out.columns).toEqual(["region", "sum_net"]);
    expect(out.rows).toEqual([
      ["South", 110],
      ["North", 100],
    ]);
  });
});

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

describe("guards & preview", () => {
  test("isAgg / isFilterOp recognise valid tokens only", () => {
    expect(isAgg("sum")).toBe(true);
    expect(isAgg("median")).toBe(true);
    expect(isAgg("countDistinct")).toBe(true);
    expect(isAgg("stddev")).toBe(false);
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

describe("dateExtract", () => {
  const base: Table = {
    columns: ["Order", "Date"],
    rows: [
      ["A", "2024-03-15"],
      ["B", "2023-11-02"],
      ["C", "2024-01-31"],
    ],
  };

  test("year/month/day come back as numbers", () => {
    const y = dateExtract(base, { column: "Date", part: "year" });
    expect(y.columns).toEqual(["Order", "Date", "Date year"]);
    expect(y.rows.map((r) => r[2])).toEqual([2024, 2023, 2024]);
    for (const r of y.rows) expect(typeof r[2]).toBe("number");

    const mo = dateExtract(base, { column: "Date", part: "month" });
    expect(mo.rows.map((r) => r[2])).toEqual([3, 11, 1]);

    const d = dateExtract(base, { column: "Date", part: "day" });
    expect(d.rows.map((r) => r[2])).toEqual([15, 2, 31]);
  });

  test("quarter is a 1–4 number", () => {
    const q = dateExtract(base, { column: "Date", part: "quarter" });
    expect(q.rows.map((r) => r[2])).toEqual([1, 4, 1]);
    for (const r of q.rows) expect(typeof r[2]).toBe("number");
  });

  test("weekday returns the day name", () => {
    const w = dateExtract(base, { column: "Date", part: "weekday" });
    // 2024-03-15 = Friday, 2023-11-02 = Thursday, 2024-01-31 = Wednesday
    expect(w.rows.map((r) => r[2])).toEqual(["Friday", "Thursday", "Wednesday"]);
  });

  test("yearMonth / yearQuarter return zero-padded labels", () => {
    const ym = dateExtract(base, { column: "Date", part: "yearMonth" });
    expect(ym.rows.map((r) => r[2])).toEqual(["2024-03", "2023-11", "2024-01"]);
    const yq = dateExtract(base, { column: "Date", part: "yearQuarter" });
    expect(yq.rows.map((r) => r[2])).toEqual(["2024-Q1", "2023-Q4", "2024-Q1"]);
  });

  test("accepts slash delimiters and ISO time suffixes", () => {
    const t: Table = {
      columns: ["Date"],
      rows: [["2024/06/09"], ["2024-06-09T13:45:00Z"], ["2024-06-09 08:00"]],
    };
    const out = dateExtract(t, { column: "Date", part: "yearMonth" });
    expect(out.rows.map((r) => r[1])).toEqual(["2024-06", "2024-06", "2024-06"]);
  });

  test("unparseable, non-string, and impossible calendar dates become null", () => {
    const t: Table = {
      columns: ["Date"],
      rows: [["not a date"], [""], [42], [null], [true], ["2024-02-30"], ["2023-13-01"]],
    };
    const out = dateExtract(t, { column: "Date", part: "month" });
    expect(out.rows.map((r) => r[1])).toEqual([null, null, null, null, null, null, null]);
  });

  test("custom into name overrides the default", () => {
    const out = dateExtract(base, { column: "Date", part: "year", into: "FY" });
    expect(out.columns).toEqual(["Order", "Date", "FY"]);
    expect(out.rows[0]).toEqual(["A", "2024-03-15", 2024]);
  });

  test("keepOriginal:false replaces the source column in place", () => {
    const out = dateExtract(base, { column: "Date", part: "year", keepOriginal: false });
    expect(out.columns).toEqual(["Order", "Date year"]);
    expect(out.rows[0]).toEqual(["A", 2024]);
    expect(out.rows[1]).toEqual(["B", 2023]);
  });

  test("throws a friendly error for a missing column", () => {
    expect(() => dateExtract(base, { column: "Nope", part: "year" })).toThrow(/not found/);
  });

  test("runs through applyTransform with the same result", () => {
    const direct = dateExtract(base, { column: "Date", part: "quarter" });
    const viaDispatch = applyTransform(base, {
      op: "dateExtract",
      params: { column: "Date", part: "quarter" },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

describe("round", () => {
  const base: Table = {
    columns: ["Item", "Price", "Qty"],
    rows: [
      ["Widget", 3.14159, 10],
      ["Gadget", 2.71828, 4],
      ["Gizmo", 1.23456, 7],
    ],
  };

  test("rounds a single column to 2 decimal places, leaving others untouched", () => {
    const out = round(base, { columns: ["Price"], decimals: 2 });
    expect(out.columns).toEqual(["Item", "Price", "Qty"]);
    expect(out.rows.map((r) => r[1])).toEqual([3.14, 2.72, 1.23]);
    expect(out.rows.map((r) => r[2])).toEqual([10, 4, 7]);
  });

  test("rounds to whole numbers with decimals: 0", () => {
    const out = round(base, { columns: ["Price"], decimals: 0 });
    expect(out.rows.map((r) => r[1])).toEqual([3, 3, 1]);
  });

  test("defaults to 0 decimal places when decimals is omitted", () => {
    const out = round(base, { columns: ["Price"] });
    expect(out.rows.map((r) => r[1])).toEqual([3, 3, 1]);
  });

  test("rounds half away from zero (spreadsheet ROUND, not banker's rounding)", () => {
    const halves: Table = {
      columns: ["N"],
      rows: [[0.5], [-0.5], [1.5], [2.5], [-2.5]],
    };
    const out = round(halves, { columns: ["N"], decimals: 0 });
    expect(out.rows.map((r) => r[0])).toEqual([1, -1, 2, 3, -3]);
  });

  test("supports negative decimals to round to tens/hundreds", () => {
    const big: Table = {
      columns: ["N"],
      rows: [[1250], [1240], [1234], [1750]],
    };
    const out = round(big, { columns: ["N"], decimals: -2 });
    expect(out.rows.map((r) => r[0])).toEqual([1300, 1200, 1200, 1800]);
  });

  test("with no columns selected, rounds every numeric column", () => {
    const mixed: Table = {
      columns: ["Item", "Price", "Qty"],
      rows: [
        ["Widget", 3.14159, 9.876],
        ["Gadget", 2.71828, 4.5],
      ],
    };
    const out = round(mixed, { decimals: 1 });
    expect(out.rows[0]).toEqual(["Widget", 3.1, 9.9]);
    expect(out.rows[1]).toEqual(["Gadget", 2.7, 4.5]);
  });

  test("passes non-numeric cells (text, boolean, null) through unchanged", () => {
    const mixed: Table = {
      columns: ["A"],
      rows: [["text"], [true], [null], [3.14159]],
    };
    const out = round(mixed, { columns: ["A"], decimals: 2 });
    expect(out.rows.map((r) => r[0])).toEqual(["text", true, null, 3.14]);
  });

  test("passes non-finite numbers (Infinity, -Infinity, NaN) through unchanged", () => {
    const odd: Table = {
      columns: ["N"],
      rows: [[Infinity], [-Infinity], [NaN]],
    };
    const out = round(odd, { columns: ["N"], decimals: 2 });
    expect(out.rows[0][0]).toBe(Infinity);
    expect(out.rows[1][0]).toBe(-Infinity);
    expect(Number.isNaN(out.rows[2][0])).toBe(true);
  });

  test("does not mutate the input table", () => {
    const snapshot = structuredClone(base);
    round(base, { columns: ["Price"], decimals: 2 });
    expect(base).toEqual(snapshot);
  });

  test("throws a friendly error for a missing column", () => {
    expect(() => round(base, { columns: ["Nope"], decimals: 2 })).toThrow(/not found/);
  });

  test("runs through applyTransform with the same result", () => {
    const direct = round(base, { columns: ["Price"], decimals: 2 });
    const viaDispatch = applyTransform(base, {
      op: "round",
      params: { columns: ["Price"], decimals: 2 },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

describe("percentOfTotal", () => {
  const base: Table = {
    columns: ["Region", "Sales"],
    rows: [
      ["North", 25],
      ["South", 25],
      ["East", 50],
    ],
  };

  test("computes each value as a share of the grand total", () => {
    const out = percentOfTotal(base, { column: "Sales" });
    expect(out.columns).toEqual(["Region", "Sales", "Sales %"]);
    expect(out.rows.map((r) => r[2])).toEqual([25, 25, 50]);
  });

  test("appends exactly one column and preserves originals", () => {
    const out = percentOfTotal(base, { column: "Sales" });
    expect(out.columns.length).toBe(base.columns.length + 1);
    expect(out.rows[0].slice(0, 2)).toEqual(["North", 25]);
  });

  test("defaults to 2 decimal places", () => {
    const t: Table = { columns: ["V"], rows: [[1], [1], [1]] };
    const out = percentOfTotal(t, { column: "V" });
    // 1/3 * 100 = 33.333... → 33.33
    expect(out.rows[0][1]).toBe(33.33);
  });

  test("honours a custom decimal count", () => {
    const t: Table = { columns: ["V"], rows: [[1], [1], [1]] };
    const out = percentOfTotal(t, { column: "V", decimals: 4 });
    expect(out.rows[0][1]).toBe(33.3333);
  });

  test("uses a custom output column name", () => {
    const out = percentOfTotal(base, { column: "Sales", into: "Share" });
    expect(out.columns).toEqual(["Region", "Sales", "Share"]);
  });

  test("computes per-group shares so each group sums to ~100", () => {
    const t: Table = {
      columns: ["Region", "Quarter", "Sales"],
      rows: [
        ["North", "Q1", 30],
        ["North", "Q2", 10],
        ["South", "Q1", 25],
        ["South", "Q2", 75],
      ],
    };
    const out = percentOfTotal(t, { column: "Sales", groupColumns: ["Region"] });
    expect(out.rows.map((r) => r[3])).toEqual([75, 25, 25, 75]);
  });

  test("parses formatted numbers tolerantly", () => {
    const t: Table = {
      columns: ["V"],
      rows: [["$1,000"], ["(500)"], ["500"]],
    };
    // 1000 + (-500) + 500 = 1000
    const out = percentOfTotal(t, { column: "V" });
    expect(out.rows.map((r) => r[1])).toEqual([100, -50, 50]);
  });

  test("non-numeric cells are excluded from the total and get null", () => {
    const t: Table = {
      columns: ["V"],
      rows: [[25], ["n/a"], [75]],
    };
    const out = percentOfTotal(t, { column: "V" });
    expect(out.rows[0][1]).toBe(25);
    expect(out.rows[1][1]).toBeNull();
    expect(out.rows[2][1]).toBe(75);
  });

  test("a zero total yields null rather than Infinity/NaN", () => {
    const t: Table = { columns: ["V"], rows: [[0], [0]] };
    const out = percentOfTotal(t, { column: "V" });
    expect(out.rows.every((r) => r[1] === null)).toBe(true);
  });

  test("an empty column (no numeric values) yields all null", () => {
    const t: Table = { columns: ["V"], rows: [["x"], ["y"]] };
    const out = percentOfTotal(t, { column: "V" });
    expect(out.rows.every((r) => r[1] === null)).toBe(true);
  });

  test("does not mutate the input table", () => {
    const snapshot = structuredClone(base);
    percentOfTotal(base, { column: "Sales" });
    expect(base).toEqual(snapshot);
  });

  test("throws a friendly error for a missing value column", () => {
    expect(() => percentOfTotal(base, { column: "Nope" })).toThrow(/not found/);
  });

  test("throws a friendly error for a missing group column", () => {
    expect(() => percentOfTotal(base, { column: "Sales", groupColumns: ["Nope"] })).toThrow(
      /not found/,
    );
  });

  test("runs through applyTransform with the same result", () => {
    const direct = percentOfTotal(base, { column: "Sales", decimals: 1 });
    const viaDispatch = applyTransform(base, {
      op: "percentOfTotal",
      params: { column: "Sales", decimals: 1 },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

describe("runningTotal", () => {
  const base: Table = {
    columns: ["Region", "Sales"],
    rows: [
      ["North", 25],
      ["South", 25],
      ["East", 50],
    ],
  };

  test("computes a cumulative sum down the whole column", () => {
    const out = runningTotal(base, { column: "Sales" });
    expect(out.columns).toEqual(["Region", "Sales", "Sales running total"]);
    expect(out.rows.map((r) => r[2])).toEqual([25, 50, 100]);
  });

  test("appends exactly one column and preserves originals", () => {
    const out = runningTotal(base, { column: "Sales" });
    expect(out.columns.length).toBe(base.columns.length + 1);
    expect(out.rows[0].slice(0, 2)).toEqual(["North", 25]);
  });

  test("keeps integer sums exact when unrounded", () => {
    const t: Table = { columns: ["V"], rows: [[1], [2], [3]] };
    const out = runningTotal(t, { column: "V" });
    expect(out.rows.map((r) => r[1])).toEqual([1, 3, 6]);
  });

  test("restarts the total for each group (partitioned)", () => {
    const t: Table = {
      columns: ["Region", "Sales"],
      rows: [
        ["North", 10],
        ["South", 100],
        ["North", 20],
        ["South", 200],
      ],
    };
    const out = runningTotal(t, { column: "Sales", groupColumns: ["Region"] });
    // North: 10 → 30 ; South: 100 → 300 ; original row order preserved
    expect(out.rows.map((r) => r[2])).toEqual([10, 100, 30, 300]);
  });

  test("supports multi-column group keys", () => {
    const t: Table = {
      columns: ["Region", "Quarter", "Sales"],
      rows: [
        ["North", "Q1", 5],
        ["North", "Q1", 5],
        ["North", "Q2", 7],
      ],
    };
    const out = runningTotal(t, { column: "Sales", groupColumns: ["Region", "Quarter"] });
    expect(out.rows.map((r) => r[3])).toEqual([5, 10, 7]);
  });

  test("parses formatted numbers tolerantly", () => {
    const t: Table = {
      columns: ["V"],
      rows: [["$1,000"], ["(500)"], ["500"]],
    };
    // 1000 → 500 → 1000
    const out = runningTotal(t, { column: "V" });
    expect(out.rows.map((r) => r[1])).toEqual([1000, 500, 1000]);
  });

  test("non-numeric cells contribute zero and carry the prior total forward", () => {
    const t: Table = { columns: ["V"], rows: [[25], ["n/a"], [75]] };
    const out = runningTotal(t, { column: "V" });
    expect(out.rows.map((r) => r[1])).toEqual([25, 25, 100]);
  });

  test("rounds the output when decimals is given (precision kept internally)", () => {
    const t: Table = { columns: ["V"], rows: [[0.1], [0.2], [0.3]] };
    const out = runningTotal(t, { column: "V", decimals: 1 });
    expect(out.rows.map((r) => r[1])).toEqual([0.1, 0.3, 0.6]);
  });

  test("uses a custom output column name", () => {
    const out = runningTotal(base, { column: "Sales", into: "Cumulative" });
    expect(out.columns).toEqual(["Region", "Sales", "Cumulative"]);
  });

  test("appends the column even when there are no rows", () => {
    const t: Table = { columns: ["V"], rows: [] };
    const out = runningTotal(t, { column: "V" });
    expect(out.columns).toEqual(["V", "V running total"]);
    expect(out.rows).toEqual([]);
  });

  test("does not mutate the input table", () => {
    const snapshot = structuredClone(base);
    runningTotal(base, { column: "Sales" });
    expect(base).toEqual(snapshot);
  });

  test("throws a friendly error for a missing value column", () => {
    expect(() => runningTotal(base, { column: "Nope" })).toThrow(/not found/);
  });

  test("throws a friendly error for a missing group column", () => {
    expect(() => runningTotal(base, { column: "Sales", groupColumns: ["Nope"] })).toThrow(
      /not found/,
    );
  });

  test("runs through applyTransform with the same result", () => {
    const direct = runningTotal(base, { column: "Sales", groupColumns: ["Region"] });
    const viaDispatch = applyTransform(base, {
      op: "runningTotal",
      params: { column: "Sales", groupColumns: ["Region"] },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

/* ------------------------------------------------------------------ */
/* rank                                                                */
/* ------------------------------------------------------------------ */

describe("rank", () => {
  const base: Table = {
    columns: ["Region", "Sales"],
    rows: [
      ["North", 100],
      ["South", 90],
      ["East", 90],
      ["West", 80],
    ],
  };

  test("ranks descending with competition ties by default", () => {
    const out = rank(base, { column: "Sales" });
    expect(out.columns).toEqual(["Region", "Sales", "Sales rank"]);
    expect(out.rows.map((r) => r[2])).toEqual([1, 2, 2, 4]);
  });

  test("appends exactly one column and preserves originals", () => {
    const out = rank(base, { column: "Sales" });
    expect(out.columns.length).toBe(base.columns.length + 1);
    expect(out.rows[0].slice(0, 2)).toEqual(["North", 100]);
  });

  test("ranks ascending when descending is false", () => {
    const out = rank(base, { column: "Sales", descending: false });
    expect(out.rows.map((r) => r[2])).toEqual([4, 2, 2, 1]);
  });

  test("dense ties share a rank with no gap", () => {
    const out = rank(base, { column: "Sales", method: "dense" });
    expect(out.rows.map((r) => r[2])).toEqual([1, 2, 2, 3]);
  });

  test("ordinal gives every row a distinct rank, ties broken by original order", () => {
    const out = rank(base, { column: "Sales", method: "ordinal" });
    expect(out.rows.map((r) => r[2])).toEqual([1, 2, 3, 4]);
  });

  test("restarts ranking within each group (partitioned)", () => {
    const t: Table = {
      columns: ["Team", "Score"],
      rows: [
        ["A", 10],
        ["B", 5],
        ["A", 30],
        ["B", 50],
      ],
    };
    const out = rank(t, { column: "Score", groupColumns: ["Team"] });
    expect(out.rows.map((r) => r[2])).toEqual([2, 2, 1, 1]);
  });

  test("supports multi-column group keys", () => {
    const t: Table = {
      columns: ["Region", "Year", "Sales"],
      rows: [
        ["N", "2024", 10],
        ["N", "2024", 20],
        ["N", "2025", 5],
      ],
    };
    const out = rank(t, { column: "Sales", groupColumns: ["Region", "Year"] });
    expect(out.rows.map((r) => r[3])).toEqual([2, 1, 1]);
  });

  test("reads formatted numbers tolerantly", () => {
    const t: Table = { columns: ["V"], rows: [["$1,000"], ["(500)"], ["750"]] };
    const out = rank(t, { column: "V" });
    expect(out.rows.map((r) => r[1])).toEqual([1, 3, 2]);
  });

  test("gives non-numeric values a blank rank and excludes them from ranking", () => {
    const t: Table = { columns: ["V"], rows: [[100], ["n/a"], [50]] };
    const out = rank(t, { column: "V" });
    expect(out.rows.map((r) => r[1])).toEqual([1, null, 2]);
  });

  test("uses a custom into name", () => {
    const out = rank(base, { column: "Sales", into: "Position" });
    expect(out.columns[out.columns.length - 1]).toBe("Position");
  });

  test("appends the column even when there are no rows", () => {
    const t: Table = { columns: ["V"], rows: [] };
    const out = rank(t, { column: "V" });
    expect(out.columns).toEqual(["V", "V rank"]);
    expect(out.rows).toEqual([]);
  });

  test("does not mutate the input table", () => {
    const snapshot = structuredClone(base);
    rank(base, { column: "Sales" });
    expect(base).toEqual(snapshot);
  });

  test("throws a friendly error for a missing value column", () => {
    expect(() => rank(base, { column: "Nope" })).toThrow(/not found/);
  });

  test("throws a friendly error for a missing group column", () => {
    expect(() => rank(base, { column: "Sales", groupColumns: ["Nope"] })).toThrow(/not found/);
  });

  test("runs through applyTransform with the same result", () => {
    const direct = rank(base, { column: "Sales", groupColumns: ["Region"], method: "dense" });
    const viaDispatch = applyTransform(base, {
      op: "rank",
      params: { column: "Sales", groupColumns: ["Region"], method: "dense" },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

describe("difference", () => {
  const base: Table = {
    columns: ["Month", "Sales"],
    rows: [
      ["Jan", 100],
      ["Feb", 150],
      ["Mar", 120],
      ["Apr", 200],
    ],
  };

  test("computes the change from the previous row by default", () => {
    const out = difference(base, { column: "Sales" });
    expect(out.columns).toEqual(["Month", "Sales", "Sales change"]);
    expect(out.rows.map((r) => r[2])).toEqual([null, 50, -30, 80]);
  });

  test("appends exactly one column and preserves originals", () => {
    const out = difference(base, { column: "Sales" });
    expect(out.columns.length).toBe(base.columns.length + 1);
    expect(out.rows[1].slice(0, 2)).toEqual(["Feb", 150]);
  });

  test("compares against a row further back with offset", () => {
    const out = difference(base, { column: "Sales", offset: 2 });
    expect(out.rows.map((r) => r[2])).toEqual([null, null, 20, 50]);
  });

  test("treats offset below 1 as 1", () => {
    const out = difference(base, { column: "Sales", offset: 0 });
    expect(out.rows.map((r) => r[2])).toEqual([null, 50, -30, 80]);
  });

  test("expresses the change as a percent of the prior value", () => {
    const out = difference(base, { column: "Sales", asPercent: true, decimals: 2 });
    expect(out.columns[out.columns.length - 1]).toBe("Sales % change");
    expect(out.rows.map((r) => r[2])).toEqual([null, 50, -20, 66.67]);
  });

  test("blanks a percent change when the prior value is zero", () => {
    const t: Table = { columns: ["Label", "V"], rows: [["a", 0], ["b", 50]] };
    const out = difference(t, { column: "V", asPercent: true });
    expect(out.rows.map((r) => r[2])).toEqual([null, null]);
  });

  test("restarts the comparison within each group (partitioned)", () => {
    const t: Table = {
      columns: ["Region", "Q", "Sales"],
      rows: [
        ["N", "Q1", 100],
        ["N", "Q2", 130],
        ["S", "Q1", 80],
        ["S", "Q2", 90],
      ],
    };
    const out = difference(t, { column: "Sales", groupColumns: ["Region"] });
    expect(out.rows.map((r) => r[3])).toEqual([null, 30, null, 10]);
  });

  test("supports multi-column group keys", () => {
    const t: Table = {
      columns: ["Region", "Year", "Sales"],
      rows: [
        ["N", "2024", 10],
        ["N", "2024", 15],
        ["N", "2025", 40],
        ["N", "2025", 55],
      ],
    };
    const out = difference(t, { column: "Sales", groupColumns: ["Region", "Year"] });
    expect(out.rows.map((r) => r[3])).toEqual([null, 5, null, 15]);
  });

  test("reads formatted numbers tolerantly", () => {
    const t: Table = { columns: ["Label", "V"], rows: [["a", "$1,000"], ["b", "(500)"], ["c", "750"]] };
    const out = difference(t, { column: "V" });
    expect(out.rows.map((r) => r[2])).toEqual([null, -1500, 1250]);
  });

  test("blanks rows whose own or comparison value is non-numeric", () => {
    const t: Table = { columns: ["Label", "V"], rows: [["a", 100], ["b", "n/a"], ["c", 50]] };
    const out = difference(t, { column: "V" });
    expect(out.rows.map((r) => r[2])).toEqual([null, null, null]);
  });

  test("uses a custom into name", () => {
    const out = difference(base, { column: "Sales", into: "Delta" });
    expect(out.columns[out.columns.length - 1]).toBe("Delta");
  });

  test("appends the column even when there are no rows", () => {
    const t: Table = { columns: ["V"], rows: [] };
    const out = difference(t, { column: "V" });
    expect(out.columns).toEqual(["V", "V change"]);
    expect(out.rows).toEqual([]);
  });

  test("does not mutate the input table", () => {
    const snapshot = structuredClone(base);
    difference(base, { column: "Sales" });
    expect(base).toEqual(snapshot);
  });

  test("throws a friendly error for a missing value column", () => {
    expect(() => difference(base, { column: "Nope" })).toThrow(/not found/);
  });

  test("throws a friendly error for a missing group column", () => {
    expect(() => difference(base, { column: "Sales", groupColumns: ["Nope"] })).toThrow(/not found/);
  });

  test("runs through applyTransform with the same result", () => {
    const direct = difference(base, { column: "Sales", asPercent: true, decimals: 1 });
    const viaDispatch = applyTransform(base, {
      op: "difference",
      params: { column: "Sales", asPercent: true, decimals: 1 },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

describe("movingAverage", () => {
  const base: Table = {
    columns: ["Month", "Sales"],
    rows: [
      ["Jan", 100],
      ["Feb", 200],
      ["Mar", 300],
      ["Apr", 400],
    ],
  };

  test("computes a trailing 3-row mean by default (partial at the edges)", () => {
    const out = movingAverage(base, { column: "Sales" });
    expect(out.columns).toEqual(["Month", "Sales", "Sales moving avg"]);
    expect(out.rows.map((r) => r[2])).toEqual([100, 150, 200, 300]);
  });

  test("appends exactly one column and preserves originals", () => {
    const out = movingAverage(base, { column: "Sales" });
    expect(out.columns.length).toBe(base.columns.length + 1);
    expect(out.rows[2].slice(0, 2)).toEqual(["Mar", 300]);
  });

  test("supports a centered window with before and after", () => {
    const out = movingAverage(base, { column: "Sales", before: 1, after: 1 });
    expect(out.rows.map((r) => r[2])).toEqual([150, 200, 300, 350]);
  });

  test("supports a forward-only window", () => {
    const out = movingAverage(base, { column: "Sales", before: 0, after: 1 });
    expect(out.rows.map((r) => r[2])).toEqual([150, 250, 350, 400]);
  });

  test("with before 0 and after 0 the window is just the current row", () => {
    const out = movingAverage(base, { column: "Sales", before: 0, after: 0 });
    expect(out.rows.map((r) => r[2])).toEqual([100, 200, 300, 400]);
  });

  test("treats a negative window size as 0", () => {
    const out = movingAverage(base, { column: "Sales", before: -3, after: 0 });
    expect(out.rows.map((r) => r[2])).toEqual([100, 200, 300, 400]);
  });

  test("rounds to the requested number of decimals", () => {
    const t: Table = { columns: ["Label", "V"], rows: [["a", 100], ["b", 200], ["c", 100]] };
    const out = movingAverage(t, { column: "V", decimals: 2 });
    expect(out.rows[2][2]).toBe(133.33);
  });

  test("leaves the mean unrounded when no decimals given", () => {
    const t: Table = { columns: ["Label", "V"], rows: [["a", 100], ["b", 200], ["c", 100]] };
    const out = movingAverage(t, { column: "V" });
    expect(out.rows[2][2] as number).toBeCloseTo(133.3333, 3);
  });

  test("restarts the window within each group (partitioned)", () => {
    const t: Table = {
      columns: ["Region", "Month", "Sales"],
      rows: [
        ["N", "Jan", 100],
        ["N", "Feb", 200],
        ["N", "Mar", 300],
        ["S", "Jan", 10],
        ["S", "Feb", 20],
        ["S", "Mar", 30],
      ],
    };
    const out = movingAverage(t, { column: "Sales", groupColumns: ["Region"] });
    expect(out.rows.map((r) => r[3])).toEqual([100, 150, 200, 10, 15, 20]);
  });

  test("supports multi-column group keys", () => {
    const t: Table = {
      columns: ["Region", "Year", "Sales"],
      rows: [
        ["N", "2024", 10],
        ["N", "2024", 30],
        ["N", "2025", 100],
        ["N", "2025", 300],
      ],
    };
    const out = movingAverage(t, { column: "Sales", groupColumns: ["Region", "Year"] });
    expect(out.rows.map((r) => r[3])).toEqual([10, 20, 100, 200]);
  });

  test("reads formatted numbers tolerantly", () => {
    const t: Table = {
      columns: ["Label", "V"],
      rows: [["a", "$1,000"], ["b", "(500)"], ["c", "1,000"]],
    };
    const out = movingAverage(t, { column: "V" });
    expect(out.rows.map((r) => r[2])).toEqual([1000, 250, 500]);
  });

  test("skips non-numeric cells inside the window", () => {
    const t: Table = { columns: ["Label", "V"], rows: [["a", 100], ["b", "n/a"], ["c", 200]] };
    const out = movingAverage(t, { column: "V" });
    expect(out.rows.map((r) => r[2])).toEqual([100, 100, 150]);
  });

  test("blanks a row whose entire window is non-numeric", () => {
    const t: Table = { columns: ["Label", "V"], rows: [["a", "x"], ["b", "y"]] };
    const out = movingAverage(t, { column: "V", before: 0, after: 0 });
    expect(out.rows.map((r) => r[2])).toEqual([null, null]);
  });

  test("uses a custom into name", () => {
    const out = movingAverage(base, { column: "Sales", into: "MA3" });
    expect(out.columns[out.columns.length - 1]).toBe("MA3");
  });

  test("appends the column even when there are no rows", () => {
    const t: Table = { columns: ["V"], rows: [] };
    const out = movingAverage(t, { column: "V" });
    expect(out.columns).toEqual(["V", "V moving avg"]);
    expect(out.rows).toEqual([]);
  });

  test("does not mutate the input table", () => {
    const snapshot = structuredClone(base);
    movingAverage(base, { column: "Sales", before: 1, after: 1 });
    expect(base).toEqual(snapshot);
  });

  test("throws a friendly error for a missing value column", () => {
    expect(() => movingAverage(base, { column: "Nope" })).toThrow(/not found/);
  });

  test("throws a friendly error for a missing group column", () => {
    expect(() => movingAverage(base, { column: "Sales", groupColumns: ["Nope"] })).toThrow(
      /not found/,
    );
  });

  test("runs through applyTransform with the same result", () => {
    const direct = movingAverage(base, { column: "Sales", before: 1, after: 1, decimals: 1 });
    const viaDispatch = applyTransform(base, {
      op: "movingAverage",
      params: { column: "Sales", before: 1, after: 1, decimals: 1 },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

describe("bin", () => {
  const base: Table = {
    columns: ["Name", "Age"],
    rows: [
      ["A", 7],
      ["B", 23],
      ["C", 30],
      ["D", 41],
      ["E", 0],
    ],
  };

  test("buckets values to their lower edge by default", () => {
    const out = bin(base, { column: "Age", size: 10 });
    expect(out.columns).toEqual(["Name", "Age", "Age bin"]);
    expect(out.rows.map((r) => r[2])).toEqual([0, 20, 30, 40, 0]);
  });

  test("a value on an edge falls in the bin where it is the lower edge", () => {
    // 30 with size 10 -> [30, 40), not [20, 30)
    const out = bin(base, { column: "Age", size: 10 });
    expect(out.rows[2][2]).toBe(30);
  });

  test("label 'upper' returns the upper edge", () => {
    const out = bin(base, { column: "Age", size: 10, label: "upper" });
    expect(out.rows.map((r) => r[2])).toEqual([10, 30, 40, 50, 10]);
  });

  test("label 'range' returns the half-open interval as text", () => {
    const out = bin(base, { column: "Age", size: 10, label: "range" });
    expect(out.rows.map((r) => r[2])).toEqual([
      "[0, 10)",
      "[20, 30)",
      "[30, 40)",
      "[40, 50)",
      "[0, 10)",
    ]);
  });

  test("origin shifts where the edges align", () => {
    // origin 5, size 10 -> edges ...-5, 5, 15, 25, 35... so 7->5, 23->15, 30->25, 41->35, 0->-5
    const out = bin(base, { column: "Age", size: 10, origin: 5 });
    expect(out.rows.map((r) => r[2])).toEqual([5, 15, 25, 35, -5]);
  });

  test("custom output column name via into", () => {
    const out = bin(base, { column: "Age", size: 10, into: "Age band" });
    expect(out.columns).toEqual(["Name", "Age", "Age band"]);
  });

  test("handles negative values cleanly (half-open, negative-safe)", () => {
    const t: Table = { columns: ["V"], rows: [[-1], [-10], [-11], [-0.0001]] };
    const out = bin(t, { column: "V", size: 10, label: "range" });
    // -1 -> [-10, 0); -10 -> [-10, 0); -11 -> [-20, -10); -0.0001 -> [-10, 0)
    expect(out.rows.map((r) => r[1])).toEqual([
      "[-10, 0)",
      "[-10, 0)",
      "[-20, -10)",
      "[-10, 0)",
    ]);
  });

  test("reads formatted numbers tolerantly", () => {
    const t: Table = { columns: ["V"], rows: [["$1,234"], ["1,234"], ["(5)"]] };
    const out = bin(t, { column: "V", size: 1000 });
    expect(out.rows.map((r) => r[1])).toEqual([1000, 1000, -1000]);
  });

  test("non-numeric and blank cells produce a blank bin", () => {
    const t: Table = { columns: ["V"], rows: [["abc"], [""], [null], [12]] };
    const out = bin(t, { column: "V", size: 10 });
    expect(out.rows.map((r) => r[1])).toEqual([null, null, null, 10]);
  });

  test("suppresses IEEE-754 drift in the edges", () => {
    const t: Table = { columns: ["V"], rows: [[0.3]] };
    const out = bin(t, { column: "V", size: 0.1, label: "range" });
    // 0.3 / 0.1 floor -> 3 -> lo 0.3, hi 0.4 without float noise like 0.30000000000000004
    expect(out.rows[0][1]).toBe("[0.3, 0.4)");
  });

  test("supports a fractional bin size", () => {
    const t: Table = { columns: ["V"], rows: [[0.05], [0.12], [0.27]] };
    const out = bin(t, { column: "V", size: 0.1 });
    expect(out.rows.map((r) => r[1])).toEqual([0, 0.1, 0.2]);
  });

  test("throws for a non-positive size", () => {
    expect(() => bin(base, { column: "Age", size: 0 })).toThrow(/greater than 0/);
    expect(() => bin(base, { column: "Age", size: -5 })).toThrow(/greater than 0/);
  });

  test("throws a friendly error for a missing column", () => {
    expect(() => bin(base, { column: "Nope", size: 10 })).toThrow(/not found/);
  });

  test("preserves row order and existing columns", () => {
    const out = bin(base, { column: "Age", size: 10 });
    expect(out.rows.map((r) => [r[0], r[1]])).toEqual(base.rows);
  });

  test("runs through applyTransform with the same result", () => {
    const direct = bin(base, { column: "Age", size: 10, label: "range" });
    const viaDispatch = applyTransform(base, {
      op: "bin",
      params: { column: "Age", size: 10, label: "range" },
    });
    expect(viaDispatch).toEqual(direct);
  });
});

describe("fxNormalize", () => {
  const base: Table = {
    columns: ["Item", "Price"],
    rows: [
      ["Widget", 10],
      ["Gadget", 25],
      ["Gizmo", 4.5],
    ],
  };

  test("converts a money column by the baked rate and appends a column", () => {
    const out = fxNormalize(base, { column: "Price", from: "USD", to: "GBP", rate: 0.8 });
    expect(out.columns).toEqual(["Item", "Price", "Price (GBP)"]);
    expect(out.rows.map((r) => r[2])).toEqual([8, 20, 3.6]);
  });

  test("same-currency conversion passes through at rate 1 without a rate", () => {
    const out = fxNormalize(base, { column: "Price", from: "GBP", to: "GBP" });
    expect(out.rows.map((r) => r[2])).toEqual([10, 25, 4.5]);
  });

  test("uppercases and trims the currency codes for labelling", () => {
    const out = fxNormalize(base, { column: "Price", from: " usd ", to: " eur ", rate: 0.9 });
    expect(out.columns[2]).toBe("Price (EUR)");
  });

  test("rounds to the requested decimals", () => {
    const out = fxNormalize(base, {
      column: "Price",
      from: "USD",
      to: "GBP",
      rate: 0.8123,
      decimals: 2,
    });
    expect(out.rows.map((r) => r[2])).toEqual([8.12, 20.31, 3.66]);
  });

  test("custom output column name via into", () => {
    const out = fxNormalize(base, {
      column: "Price",
      from: "USD",
      to: "GBP",
      rate: 0.8,
      into: "Price GBP",
    });
    expect(out.columns).toEqual(["Item", "Price", "Price GBP"]);
  });

  test("reads formatted numbers tolerantly", () => {
    const t: Table = { columns: ["V"], rows: [["$1,234"], ["1,234"], ["(5)"]] };
    const out = fxNormalize(t, { column: "V", from: "USD", to: "GBP", rate: 0.5 });
    expect(out.rows.map((r) => r[1])).toEqual([617, 617, -2.5]);
  });

  test("non-numeric and blank cells produce a blank result", () => {
    const t: Table = { columns: ["V"], rows: [["abc"], [""], [null], [12]] };
    const out = fxNormalize(t, { column: "V", from: "USD", to: "GBP", rate: 2 });
    expect(out.rows.map((r) => r[1])).toEqual([null, null, null, 24]);
  });

  test("throws a friendly error when no rate was resolved", () => {
    expect(() => fxNormalize(base, { column: "Price", from: "USD", to: "GBP" })).toThrow(
      /No exchange rate was resolved/,
    );
  });

  test("throws when a currency code is missing", () => {
    expect(() => fxNormalize(base, { column: "Price", from: "USD", to: "", rate: 1 })).toThrow(
      /'from' and a 'to'/,
    );
  });

  test("throws a friendly error for a missing column", () => {
    expect(() => fxNormalize(base, { column: "Nope", from: "USD", to: "GBP", rate: 1 })).toThrow(
      /not found/,
    );
  });

  test("preserves row order and existing columns", () => {
    const out = fxNormalize(base, { column: "Price", from: "USD", to: "GBP", rate: 0.8 });
    expect(out.rows.map((r) => [r[0], r[1]])).toEqual(base.rows);
  });

  test("runs through applyTransform with the same result", () => {
    const direct = fxNormalize(base, { column: "Price", from: "USD", to: "GBP", rate: 0.8 });
    const viaDispatch = applyTransform(base, {
      op: "fxNormalize",
      params: { column: "Price", from: "USD", to: "GBP", rate: 0.8 },
    });
    expect(viaDispatch).toEqual(direct);
  });
});
