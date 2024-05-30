import { useState, type FC } from "react";
import { v4 as uuidv4 } from "uuid";

import { Container } from "./Container.js";
import { CustomDragLayer } from "./CustomDragLayer.js";
import { DraggableBox } from "./DraggableBox.js";
import useSWR, { mutate } from "swr";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "./Dialog.js";
import Graph from "../Graph.js";

const allCombinationsUrl = "http://localhost:8080/review/allCombinations";

export const Example: FC = () => {
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: combinations } = useSWR<string[]>(allCombinationsUrl, fetcher);
  const [searchTerm, setSearchTerm] = useState("");
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [nodeName, setNodeName] = useState<string>("NONE");

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
          <div className="relative h-10 w-full min-w-[200px]">
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              className="pt-2 peer h-full w-full rounded-[7px] border border-blue-gray-200 bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-pink-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
            />
            <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-pink-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-pink-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-pink-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              Filter
            </label>
          </div>
          <button
            onClick={() => {
              fetch(allCombinationsUrl, {
                method: "DELETE",
              }).then(() => mutate(allCombinationsUrl, []));
            }}
            className="rounded-lg bg-red-700 py-2 px-6 font-sans text-xs font-bold uppercase text-white shadow-md shadow-red-500/20 transition-all hover:shadow-lg hover:shadow-red-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            data-ripple-light="true"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
};
