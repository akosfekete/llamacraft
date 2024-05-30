import type { CSSProperties, FC } from "react";
import { memo } from "react";

import { Box } from "./Box.js";

const styles: CSSProperties = {
  display: "inline-block",
  transform: "rotate(-7deg)",
  WebkitTransform: "rotate(-7deg)",
};

export interface BoxDragPreviewProps {
  title: string;
  id: string;
}

export interface BoxDragPreviewState {}

export const BoxDragPreview: FC<BoxDragPreviewProps> = memo(
  function BoxDragPreview({ title, id }) {
    return (
      <div style={styles}>
        <Box id={id} title={title} preview />
      </div>
    );
  }
);
