import { GraphCanvas, GraphEdge, GraphNode, darkTheme, recommendLayout } from "reagraph";
import useSWR from "swr";

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const graphDataUrl = "http://localhost:8080/review/hierarchyForNode";

export default function Graph(props: { nodeName: string }) {
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: graphData } = useSWR<GraphData>(
    `${graphDataUrl}?nodeName=${props.nodeName}`,
    fetcher
  );

  const layout = recommendLayout(graphData?.nodes ?? [], graphData?.edges ?? []);

  return (
    <div className="flex min-h-0 min-w-0">
      <div className="">
        <GraphCanvas
          theme={darkTheme}
          draggable
          labelType="all"
          layoutType={layout}
          nodes={
            graphData?.nodes.map((node) =>
              node.id === props.nodeName ? { fill: "gold", ...node } : node
            ) ?? []
          }
          edges={graphData?.edges ?? []}
        />
      </div>
    </div>
  );
}
