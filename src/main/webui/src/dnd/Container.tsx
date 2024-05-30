import update from "immutability-helper";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { useDrop } from "react-dnd";
import { v4 as uuidv4 } from "uuid";

import { DraggableBox, ItemDropData } from "./DraggableBox.js";
import type { DragItem } from "./interfaces";
import { ItemTypes } from "./ItemTypes.js";

export interface ContainerProps {
  snapToGrid: boolean;
  itemAdded: (name: string) => void;
  graphOpenedForItem: (name: string) => void;
}

interface BoxMap {
  [key: string]: { top: number; left: number; title: string; value: string };
}

export const Container: FC<ContainerProps> = ({
  itemAdded,
  graphOpenedForItem,
}) => {
  const [boxes, setBoxes] = useState<BoxMap>({});

  const moveBox = useCallback(
    (id: string, left: number, top: number, title: string, value: string) => {
      if (boxes[id]) {
        setBoxes((boxes) =>
          update(boxes, {
            [id]: {
              $merge: { left, top },
            },
          })
        );
      } else {
        // const newBox = {left, top, title: "test"};
        // const newBoxes = {...boxes, id: newBox};
        setBoxes((boxes) =>
          update(boxes, { [id]: { $set: { left, top, title, value } } })
        );
        // setBoxes(newBoxes);
      }
      console.log(boxes);
    },
    [boxes]
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
        // if (snapToGrid) {
        //   [left, top] = doSnapToGrid(left, top);
        // }

        moveBox(item.id, left, top, item.title, item.value);
        return undefined;
      },
    }),
    [moveBox]
  );

  const otherItemDropped = (
    firstItem: ItemDropData,
    secondItem: ItemDropData
  ) => {
    {
      if (firstItem.id === secondItem.id) {
        return;
      }
      setBoxes((boxes) => {
        const firstTitle = boxes[firstItem.id].title;
        const secondTitle = boxes[secondItem.id]?.title ?? secondItem.title;

        fetch(
          `http://localhost:8080/review/combine?first=${firstTitle}&second=${secondTitle}`
        )
          .then((res) => res.text())
          .then((res) => {
            itemAdded(res);
            setBoxes((boxes) =>
              update(boxes, {
                [firstItem.id]: {
                  $merge: { title: res },
                },
              })
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
    </div>
  );
};
