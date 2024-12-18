import { useState } from "react";
import "./App.css";
import { Exercise } from "./Exercise/Exercise";
import { Solution } from "./Exercise/Solution";

const SelectedButton: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
}> = ({ selected, onClick, title }) => (
  <button
    style={{
      border: selected ? "3px solid black" : "3px solid transparent",
    }}
    onClick={onClick}
  >
    {title}
  </button>
);

const App = () => {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div>
      <div
        style={{
          backgroundColor: showSolution ? "lightgreen" : "orange",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
        }}
      >
        <h3>Ledger Device Management Kit Workshop</h3>
        <h5>
          Goal: use the Ledger Device Management Kit to connect to a Ledger
          device and get an Ethereum address.{"\n"}Bonus: sign a transaction.
        </h5>
        <div
          style={{
            alignSelf: "center",
            display: "flex",
            flexDirection: "row",
            columnGap: 10,
          }}
        >
          <SelectedButton
            title="Exercise"
            selected={!showSolution}
            onClick={() => setShowSolution(false)}
          />
          <SelectedButton
            title="Solution"
            selected={showSolution}
            onClick={() => setShowSolution(true)}
          />
        </div>
        {showSolution ? (
          <>
            <p>
              The code for this implementation is in{" "}
              <pre>src/Exercise/Solution.tsx</pre>
            </p>
          </>
        ) : (
          <>
            <p>
              The code for this implementation is in{" "}
              <pre>src/Exercise/Exercise.tsx</pre>
            </p>
          </>
        )}
      </div>
      {showSolution ? <Solution /> : <Exercise />}
    </div>
  );
};

export default App;
