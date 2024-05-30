import "./App.css";
import Example from "./dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Example />
    </DndProvider>
  );
}

export default App;
