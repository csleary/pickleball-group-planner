import "./App.css";
import { useCallback, useEffect, useState } from "react";

const MAX_GROUP_SIZE = 12;
const COURTS_PER_GROUP = 3;
const MAX_NUM_GROUPS = 2;

const configs = [
    ["Maximum number of players per group (12):", "maxGroupSize"],
    ["Maximum number of courts per group (3):", "courtsPerGroup"],
    ["Maximum number of groups (2):", "maxNumGroups"],
].map(([label, name]) => ({
    label,
    name,
    classNames: "border-2 rounded-md w-24 p-3",
}));

const shuffleArray = array => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const intArray = new Uint32Array(1);
        crypto.getRandomValues(intArray);
        const random = intArray[0] / (0xffffffff + 1);
        const j = Math.floor(random * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }

    return shuffled;
};

const defaultConfig = { maxGroupSize: MAX_GROUP_SIZE, courtsPerGroup: COURTS_PER_GROUP, maxNumGroups: MAX_NUM_GROUPS };

function App() {
    const [text, setText] = useState("");
    const [config, setConfig] = useState(defaultConfig);
    const [playGroups, setPlayGroups] = useState([]);
    const [sitouts, setSitouts] = useState([]);
    const { maxGroupSize, courtsPerGroup, maxNumGroups } = config || {};

    const handleChange = e => setText(e.target.value);

    const mixGroups = useCallback(() => {
        const players = text
            .trim()
            .split("\n")
            .filter(Boolean)
            .map(player => player.trim());

        const shuffled = shuffleArray(players);
        const numPlayers = shuffled.length;
        const numGroups = Math.min(Math.floor(numPlayers / maxGroupSize), maxNumGroups);
        const groupSize = numPlayers / numGroups;
        const groupSizeRounded = Math.min(Math.ceil(groupSize / 4) * 4, maxGroupSize);

        const groups = shuffled.flatMap((player, index, players) =>
            index % groupSizeRounded ? [] : [players.slice(index, index + groupSizeRounded)]
        );

        setPlayGroups(groups);

        // If we have sit-outs, divide them between the groups.
        if (groups.length > maxNumGroups) {
            const allSitOuts = groups.splice(maxNumGroups).flat();
            const division = Math.ceil(allSitOuts.length / maxNumGroups);

            setSitouts(
                allSitOuts.flatMap((player, index, players) =>
                    index % division ? [] : [players.slice(index, index + division)]
                )
            );
        } else {
            setSitouts([]);
        }
    }, [maxGroupSize, maxNumGroups, text]);

    useEffect(() => {
        mixGroups();
    }, [mixGroups]);

    const handleConfigChange = e => setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="md:container md:mx-auto p-4">
            <h2 className="text-4xl mb-8 text-center">Pickleball Group Planner</h2>
            <p className="mb-8">Create randomised groups of players, depending on group size and court counts.</p>
            <div className="grid grid-cols-3 gap-8 mb-8">
                {configs.map(({ label, name, classNames }) => (
                    <div key={name}>
                        <label className="block text-left mb-1" htmlFor={name}>
                            {label}
                        </label>
                        <input
                            className={classNames}
                            id={name}
                            name={name}
                            onChange={handleConfigChange}
                            type="number"
                            value={config[name]}
                        />
                    </div>
                ))}
            </div>
            <label className="block text-left mb-1" htmlFor="players">
                Who's playing? (Put each player on a new line):
            </label>
            <textarea
                className="border-2 rounded-md flex-grow h-64 p-3 mb-2 w-full"
                id="players"
                name="players"
                onChange={handleChange}
                value={text}
            />
            <button
                className="bg-green-200 border-2 border-green-300 rounded-md flex-0 py-2 px-4 mb-8 disabled:opacity-50"
                disabled={!text}
                onClick={mixGroups}
            >
                Mix!
            </button>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
                {playGroups.map((group, index) => {
                    const courtsFrom = index * courtsPerGroup + 1;
                    const courtsTo = (index + 1) * courtsPerGroup;
                    const groupNumPlayers = group.length;
                    const groupSitOuts = sitouts[index];

                    return (
                        <div className="text-left mb-4" key={index}>
                            <h3 className="mb-3 text-xl">
                                Group {index + 1} ({groupNumPlayers} players, courts {courtsFrom}-{courtsTo}):
                            </h3>
                            <ul>
                                {group.sort().map((playerName, index) => (
                                    <li key={playerName + "-" + index}>
                                        {`${index + 1}`.padStart(2, "0")}. {playerName}
                                    </li>
                                ))}
                            </ul>
                            {groupSitOuts ? (
                                <div className="my-4">
                                    Group {index + 1} sit-outs: {groupSitOuts.sort().join(", ")}.
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
            <div className="text-sm">
                Created by Chris, <a href="http://pickleball-denhaag.nl/">Pickleball Den Haag</a>.
            </div>
        </div>
    );
}

export default App;
