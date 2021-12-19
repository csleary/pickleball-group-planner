import "./App.css";
import { useCallback, useEffect, useState } from "react";

const COURTS_PER_GROUP = 3;
const MAX_NUM_GROUPS = 3;
const defaultConfig = { courtsPerGroup: COURTS_PER_GROUP, maxNumGroups: MAX_NUM_GROUPS };

const configs = [
    ["Maximum number of courts per group (default: 3):", "courtsPerGroup"],
    ["Maximum number of groups (default: 2):", "maxNumGroups"],
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

function App() {
    const [text, setText] = useState("");
    const [config, setConfig] = useState(defaultConfig);
    const [playGroups, setPlayGroups] = useState([]);
    const [sitouts, setSitouts] = useState([]);
    const [numPlayers, setNumPlayers] = useState();
    const [splitEvenly, setSplitEvenly] = useState(true);
    const { courtsPerGroup, maxNumGroups } = config || {};
    const maxGroupSize = courtsPerGroup * 4;

    const handleChange = e => setText(e.target.value);

    const mixGroups = useCallback(() => {
        const players = text
            .trim()
            .split("\n")
            .filter(Boolean)
            .map(player => player.trim());

        const shuffled = [...new Set(shuffleArray(players))];
        const numPlayers = shuffled.length;
        setNumPlayers(numPlayers);

        // Calculate group size:
        const numGroups = splitEvenly ? maxNumGroups : Math.min(Math.ceil(numPlayers / maxGroupSize), maxNumGroups);
        const avgGroupSize = numPlayers / numGroups;
        const optGroupSize = splitEvenly ? Math.floor(Math.max(avgGroupSize / 4, 1)) * 4 : maxGroupSize;
        const groupSizeRounded = Math.min(optGroupSize, maxGroupSize);

        // Split players into groups:
        const groups = shuffled.flatMap((_, index, players) =>
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
    }, [maxGroupSize, maxNumGroups, splitEvenly, text]);

    useEffect(() => {
        if (Number.parseInt(courtsPerGroup) === 1) {
            setSplitEvenly(false);
        }

        mixGroups();
    }, [courtsPerGroup, mixGroups]);

    const handleConfigChange = e => setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="md:container md:mx-auto p-4">
            <h2 className="text-4xl mb-8 text-center">Pickleball Group Planner</h2>
            <p className="mb-8">Create randomised groups of players, depending on group size and court counts.</p>
            <div className="grid grid-cols-2 gap-8 mb-8">
                {configs.map(({ label, name, classNames }) => (
                    <div className="flex flex-col" key={name}>
                        <label className="block text-left mb-1" htmlFor={name}>
                            {label}
                        </label>
                        <input
                            className={classNames}
                            id={name}
                            name={name}
                            min={1}
                            onChange={handleConfigChange}
                            type="number"
                            value={config[name]}
                        />
                        {name === "maxNumGroups" ? (
                            <label className="inline-flex items-center mt-1">
                                <input
                                    disabled={Number.parseInt(courtsPerGroup) === 1}
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={splitEvenly}
                                    onChange={e => setSplitEvenly(e.target.checked)}
                                />
                                <span className="ml-2">Split players evenly between groups?</span>
                            </label>
                        ) : null}
                    </div>
                ))}
            </div>
            <label className="block text-left mb-1" htmlFor="players">
                Who's playing? (Put each player on a new line, duplicate names will be removed):
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
            {numPlayers ? <h3 className="mb-3 text-xl">{numPlayers} players in total:</h3> : null}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
                {playGroups.map((group, index) => {
                    const courtsFrom = index * courtsPerGroup + 1;
                    const courtsTo = (index + 1) * courtsPerGroup;
                    const groupNumPlayers = group.length;
                    const groupSitOuts = sitouts[index];

                    return (
                        <div className="text-left mb-4" key={index}>
                            <h3 className="mb-3 text-xl">
                                Group {index + 1} ({groupNumPlayers} players,{" "}
                                {courtsTo > courtsFrom
                                    ? `courts ${courtsFrom}-
                                ${courtsTo}`
                                    : `court ${courtsFrom}`}
                                ):
                            </h3>
                            <ul>
                                {group.sort().map((playerName, index) => (
                                    <li key={playerName}>
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
