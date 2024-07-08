import {
  GraphCanvas,
  GraphEdge,
  GraphNode,
  darkTheme,
  recommendLayout,
} from "reagraph";
import useSWR from "swr";
import emojiRegex from 'emoji-regex';

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

  const layout = recommendLayout(
    graphData?.nodes ?? [],
    graphData?.edges ?? []
  );

  const formatLabel = (label: string | undefined): string => {
    return removeEmojis(label);
  };

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
              node.id === props.nodeName
                ? { ...node, fill: "gold", label: formatLabel(node.label) }
                : { ...node, label: formatLabel(node.label) }
            ) ?? []
          }
          edges={
            graphData?.edges.map((edge) => ({
              ...edge,
              label: formatLabel(edge.label),
            })) ?? []
          }
        />
      </div>
    </div>
  );
}

  function removeEmojis(str: string | undefined): string {
    return (
      str
        ?.replace(emojiRegex(), '')
        .replace(/\s+/g, " ")
        .trim() ?? ""
    );
  }


