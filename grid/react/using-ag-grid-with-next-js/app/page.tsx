// app/page.tsx
import GridComponent from "../components/GridComponent";

export default function Home() {
  return (
    <div className="container">
      <h1>Next.js AG Grid Example</h1>
      <GridComponent />
    </div>
  );
}
