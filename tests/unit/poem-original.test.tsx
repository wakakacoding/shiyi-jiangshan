import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PoemOriginal } from "@/components/poem/poem-original";
import type { Poem } from "@/lib/types";

const poem = {
  slug: "test", title: "测试词", preface: "三月七日，沙湖道中遇雨。",
  original: [["莫听穿林打叶声，", "何妨吟啸且徐行。"], ["料峭春风吹酒醒，", "微冷，"]],
} as Poem;

describe("PoemOriginal", () => {
  it("preserves the preface, lines and stanza boundaries", () => {
    const { container } = render(<PoemOriginal poem={poem} />);
    expect(screen.getByText("三月七日，沙湖道中遇雨。")).toBeInTheDocument();
    expect(screen.getByText("莫听穿林打叶声，")).toBeInTheDocument();
    expect(container.querySelectorAll(".original-stanza")).toHaveLength(2);
  });
});
