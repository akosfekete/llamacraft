import update from "immutability-helper";
import type { FC } from "react";
import { useCallback } from "react";
import { useDrop } from "react-dnd";
import { v4 as uuidv4 } from "uuid";

import { DraggableBox, ItemDropData } from "./DraggableBox.js";
import type { DragItem } from "./interfaces";
import { ItemTypes } from "./ItemTypes.js";
import { baseUrl } from "../const.js";
import { removeEmojis } from "../shared/string_utils.js";

export interface ContainerProps {
  boxes: BoxMap;
  setBoxes: (setter: (boxes: BoxMap) => BoxMap) => void;
  snapToGrid: boolean;
  // When a result arrived from the server: notify the parent to update things
  itemAdded: (name: string) => void;
  graphOpenedForItem: (name: string) => void;
}

export interface BoxData {
  top: number;
  left: number;
  title: string;
  value: string;
}

export interface BoxMap {
  [key: string]: BoxData;
}

export const Container: FC<ContainerProps> = ({
  itemAdded,
  boxes,
  setBoxes,
  graphOpenedForItem,
}) => {

  const moveBox = useCallback(
    (id: string, left: number, top: number, title: string, value: string) => {
      if (boxes[id]) {
        setBoxes((boxes) =>
          update(boxes, {
            [id]: {
              $merge: { left, top },
            },
          }),
        );
      } else {
        setBoxes((boxes) =>
          update(boxes, { [id]: { $set: { left, top, title, value } } }),
        );
      }
      console.log(boxes);
    },
    [boxes],
  );

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop(item: DragItem, monitor) {
        const delta = !item.fromOutside
          ? monitor.getDifferenceFromInitialOffset()
          : (monitor.getClientOffset() as {
              x: number;
              y: number;
            });

        if (!delta) {
          return;
        }
        const left = Math.round(item.left + delta.x);
        const top = Math.round(item.top + delta.y);
        if (item.fromOutside === true) {
          moveBox(uuidv4(), left, top, item.title, item.value);
          return;
        }
        moveBox(item.id, left, top, item.title, item.value);
        return undefined;
      },
    }),
    [moveBox],
  );

  const otherItemDropped = (
    firstItem: ItemDropData,
    secondItem: ItemDropData,
  ) => {
    {
      if (firstItem.id === secondItem.id) {
        return;
      }
      setBoxes((boxes) => {
        const firstTitle = boxes[firstItem.id].title;
        const secondTitle = boxes[secondItem.id]?.title ?? secondItem.title;

        fetch(
          `${baseUrl}/review/combine?first=${removeEmojis(firstTitle)}&second=${removeEmojis(secondTitle)}`,
        )
          .then((res) => res.text())
          .then((res) => {
            itemAdded(res);
            setBoxes((boxes) =>
              update(boxes, {
                [firstItem.id]: {
                  $merge: { title: res },
                },
              }),
            );
          });

        return update(boxes, {
          $unset: [secondItem.id],
          [firstItem.id]: {
            $merge: { title: `${firstTitle} + ${secondTitle} ...` },
          },
        });
      });
    }
  };

  return (
    <div ref={drop} className="grow">
      {Object.keys(boxes).map((key) => (
        <DraggableBox
          // TODO: do not allow anything on drop when request in progress (use flag)
          removed={(id) => setBoxes((boxes) => update(boxes, { $unset: [id] }))}
          onOtherItemDropped={otherItemDropped}
          graphOpenedForItem={graphOpenedForItem}
          key={key}
          id={key}
          {...(boxes[key] as { top: number; left: number; title: string })}
        />
      ))}
      <button onClick={() => setBoxes(() => ({}))} className="small-button m-3">
        Clear
      </button>
    </div>
  );
};
