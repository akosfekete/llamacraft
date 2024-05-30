import type { CSSProperties, FC } from "react";
import { memo, useEffect } from "react";
import type { DragSourceMonitor } from "react-dnd";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

import { Box } from "./Box.js";
import { ItemTypes } from "./ItemTypes.js";

function getStyles(
  left: number,
  top: number,
  isDragging: boolean,
  movable: boolean
): CSSProperties {
  const transform = `translate3d(${left}px, ${top}px, 0)`;
  return {
    position: movable ? "absolute" : "unset",
    transform: movable ? transform : "",
    WebkitTransform: movable ? transform : "",
    // IE fallback: hide the real node using CSS when dragging
    // because IE will ignore our custom "empty image" drag preview.
    opacity: isDragging ? 0 : 1,
    height: isDragging ? 0 : "",
  };
}

export interface ItemDropData {
  id: string;
  title: string;
}

export interface DraggableBoxProps {
  id: string;
  movable?: boolean;
  fromOutside?: boolean;
  title: string;
  left: number;
  top: number;
  onOtherItemDropped: (first: ItemDropData, second: ItemDropData) => void;
  removed?: (_id: string) => void;
  graphOpenedForItem?: (itemName: string) => void;
}

export const DraggableBox: FC<DraggableBoxProps> = memo(function DraggableBox(
  props
) {
  const {
    id,
    title,
    left,
    top,
    movable,
    fromOutside,
    onOtherItemDropped,
    graphOpenedForItem,
    removed,
  } = props;
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: { id, left, top, title, fromOutside },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, left, top, title]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  return (
    <div
      ref={drag}
      style={getStyles(left, top, isDragging, movable ?? true)}
      role="DraggableBox"
    >
      <Box
        fromOutside={fromOutside}
        removed={removed}
        title={title}
        id={id}
        droppedItem={(otherId, otherTitle) => {
          console.log(
            `this item: ${id}, ${title} | other item: ${otherId}, ${otherTitle}`
          );
          return onOtherItemDropped(
            { id, title },
            { id: otherId, title: otherTitle }
          );
        }}
        graphOpenedForItem={graphOpenedForItem}
      />
    </div>
  );
});
