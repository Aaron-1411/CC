// Dedicated standalone surface for the iframe embed. No site chrome.
import Calculator from "./Calculator";

export default function CalculatorEmbed() {
  return (
    <div className="min-h-screen bg-background">
      <Calculator embed />
    </div>
  );
}
