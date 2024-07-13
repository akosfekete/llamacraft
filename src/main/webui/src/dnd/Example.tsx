import { useState, type FC } from "react";
import { v4 as uuidv4 } from "uuid";

import { BoxMap, Container } from "./Container.js";
import { CustomDragLayer } from "./CustomDragLayer.js";
import { DraggableBox, ItemDropData } from "./DraggableBox.js";
import useSWR, { mutate } from "swr";
import { Dialog, DialogClose, DialogContent } from "./Dialog.js";
import Graph from "../Graph.js";
import "./filter.css";
import { baseUrl } from "../const.js";

const allCombinationsUrl = `${baseUrl}/review/allCombinations`;

export const Example: FC = () => {
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: combinations } = useSWR<string[]>(allCombinationsUrl, fetcher);
  const [searchTerm, setSearchTerm] = useState("");
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [nodeName, setNodeName] = useState<string>("NONE");
  const [boxMap, setBoxMap] = useState<BoxMap>({});

  const getRandomNumberBetween = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  };

  const addByDoubleClick = (data: ItemDropData): void => {
    setBoxMap((boxMap) => {
      return {
        ...boxMap,
        [data.id]: {
          top: getRandomNumberBetween(400, 600),
          left: getRandomNumberBetween(500, 700),
          title: data.title,
          value: data.title,
        },
      };
    });
  };

  return (
    <div className="w-screen h-screen bg-neutral-950 flex flex-row divide-x-2 divide-red-400">
      <Dialog open={graphDialogOpen} onOpenChange={setGraphDialogOpen}>
        <DialogContent className="Dialog bg-neutral-700 absolute inset-5">
          <DialogClose className="relative z-50 text-3xl">×</DialogClose>
          {nodeName !== "NONE" && <Graph nodeName={nodeName} />}
          {/* <div>henlo</div> */}
        </DialogContent>
      </Dialog>
      <Container
        boxes={boxMap}
        setBoxes={(setBoxesAction) =>
          setBoxMap((boxMap) => setBoxesAction(boxMap))
        }
        snapToGrid={false}
        itemAdded={(name) => {
          if (!combinations?.includes(name)) {
            mutate(allCombinationsUrl, [name, ...(combinations ?? [])]);
          }
        }}
        graphOpenedForItem={(itemTitle) => {
          setNodeName(itemTitle);
          setGraphDialogOpen(true);
        }}
      />
      <CustomDragLayer snapToGrid={false} />
      <div className="p-3 w-3/12 flex flex-col">
        <div className="grow w-full overflow-auto">
          <div className="flex flex-row flex-wrap gap-3">
            {combinations
              ?.filter((text) => text.toLowerCase().includes(searchTerm))
              .map((item, index) => {
                return (
                  <DraggableBox
                    key={index}
                    onBoxDoubleClicked={addByDoubleClick}
                    onOtherItemDropped={(a, b) => {
                      console.log(`dropped ${a.title} to ${b.title}`);
                    }}
                    id={uuidv4()}
                    fromOutside={true}
                    title={item}
                    movable={false}
                    left={0}
                    top={0}
                  />
                );
              })}
          </div>
        </div>
        <div className="pt-2 mt-2 min-h-24 border-t-1 flex flex-col space-y-2">
          <FilterField searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <button
            onClick={() => {
              fetch(allCombinationsUrl, {
                method: "DELETE",
              }).then(() => mutate(allCombinationsUrl, []));
            }}
            className="rounded-lg bg-red-700 py-2 px-6 font-sans text-xs font-bold uppercase text-white shadow-md shadow-red-500/20 transition-all hover:shadow-lg hover:shadow-red-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            data-ripple-light="true"
          >
            Delete all from DB
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterField = (props: {
  searchTerm: string;
  setSearchTerm: (_term: string) => void;
}) => {
  return (
    <div className="relative h-10 w-full min-w-[200px]">
      <input
        value={props.searchTerm}
        onChange={(event) => {
          props.setSearchTerm(event.target.value);
        }}
        className="peer filter-field-container"
        placeholder=" "
      />
      <label className=" filter-field">Filter</label>
    </div>
  );
};
