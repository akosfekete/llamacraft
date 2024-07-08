import type { FC } from "react";
import { memo, useState } from "react";
import { useDrop } from "react-dnd";
import { ItemTypes } from "./ItemTypes";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeading,
  PopoverTrigger,
} from "./Popover";

export interface BoxProps {
  title: string;
  id: string;
  fromOutside?: boolean;
  droppedItem?: (_id: string, _title: string) => void;
  graphOpenedForItem?: (title: string) => void;
  removed?: (_id: string) => void;
  onBoxDoubleClicked?: (_id: string, _title: string) => void;
  yellow?: boolean;
  preview?: boolean;
}

function getBtnClassName(isOver: boolean) {
  return `outline-none focus:outline-none hover:cursor-default rounded-lg py-3 px-6 font-sans 
          text-xs font-bold uppercase text-white shadow-md shadow-blue-500/20
           transition-all hover:shadow-lg hover:shadow-red-500/40 
            ${isOver ? "bg-zinc-100" : "bg-zinc-700"}`;
}

export const Box: FC<BoxProps> = memo(function Box({
  title,
  preview,
  id,
  fromOutside,
  droppedItem,
  removed,
  onBoxDoubleClicked: onBoxDoubleClicked,
  graphOpenedForItem,
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.BOX,
    drop: (item: { id: string; title: string }, _monitor) => {
      droppedItem?.(item.id, item.title);
      return { title: item.title, id: item.id };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const [open, setOpen] = useState(false);

  return (
    <div
      ref={drop}
      role={preview ? "BoxPreview" : "Box"}
      className={getBtnClassName(isOver)}
      data-ripple-light="true"
      onDoubleClick={() => onBoxDoubleClicked?.(id, title)}
    >
      <Popover open={open} onOpenChange={setOpen}>
        {fromOutside ? (
          <div>{title}</div>
        ) : (
          <PopoverTrigger onClick={() => setOpen((v) => !v)}>
            {title}
          </PopoverTrigger>
        )}

        <PopoverContent className="bg-neutral-700 p-2">
          <PopoverHeading className="text-white">Options</PopoverHeading>
          <div className="flex flex-col space-y-2 ">
            <PopoverClose className="small-button">Close</PopoverClose>
            <button
              className="small-button"
              onClick={() => graphOpenedForItem?.(title)}
            >
              Open graph
            </button>
            <button className="small-button" onClick={() => removed?.(id)}>
              Remove
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
