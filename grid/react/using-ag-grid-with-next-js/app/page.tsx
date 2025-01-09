// app/page.tsx
import GridComponent from "@/components/GridComponent";
import GridComponentSSRM from "@/components/GridComponentSSRM";

export default function Home() {
  return (
    <div className="container">
      <GridComponent />
      {/* Uncomment the component below to render the SSRM example */}
      {/* <GridComponentSSRM /> */}
    </div>
  );
}
