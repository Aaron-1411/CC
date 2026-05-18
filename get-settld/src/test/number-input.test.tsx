import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { NumberInput } from "@/components/ui/number-input";
import { useState } from "react";
import React from "react";

function Harness({ initial = 0 }: { initial?: number }) {
  const [v, setV] = useState(initial);
  return <NumberInput data-testid="ni" value={v} onChange={setV} />;
}

describe("NumberInput", () => {
  it("accepts decimals", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <NumberInput data-testid="ni" value={0} onChange={onChange} />
    );
    const input = getByTestId("ni") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5.25" } });
    expect(input.value).toBe("5.25");
    expect(onChange).toHaveBeenLastCalledWith(5.25);
  });

  it("does not get stuck at 0 after clearing and retyping", () => {
    const { getByTestId } = render(<Harness initial={100} />);
    const input = getByTestId("ni") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "7" } });
    expect(input.value).toBe("7");
    fireEvent.change(input, { target: { value: "75" } });
    expect(input.value).toBe("75");
  });

  it("strips leading zeros on retype", () => {
    const { getByTestId } = render(<Harness initial={0} />);
    const input = getByTestId("ni") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "05" } });
    expect(input.value).toBe("5");
  });

  it("allows partial decimal entry like '0.'", () => {
    const { getByTestId } = render(<Harness initial={0} />);
    const input = getByTestId("ni") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "0." } });
    expect(input.value).toBe("0.");
    fireEvent.change(input, { target: { value: "0.5" } });
    expect(input.value).toBe("0.5");
  });

  it("resets to emptyValue on blur when empty", () => {
    const { getByTestId } = render(<Harness initial={42} />);
    const input = getByTestId("ni") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(input.value).toBe("0");
  });
});
