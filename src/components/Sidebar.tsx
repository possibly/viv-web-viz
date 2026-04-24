export type TabKey = "chronicle" | "characters" | "queues" | "plans" | "sifting" | "source" | "raw";

type Props = {
    tab: TabKey;
    setTab: (t: TabKey) => void;
    counts: { chronicle: number; characters: number; queues: number; plans: number; sifting: number };
    hasSource: boolean;
    hasSifting: boolean;
};

const ALL_TABS: { key: TabKey; label: string; countKey?: "chronicle" | "characters" | "queues" | "plans" | "sifting" }[] = [
    { key: "chronicle", label: "Chronicle", countKey: "chronicle" },
    { key: "characters", label: "Characters", countKey: "characters" },
    { key: "queues", label: "Queues", countKey: "queues" },
    { key: "plans", label: "Plans", countKey: "plans" },
    { key: "sifting", label: "Sifting", countKey: "sifting" },
    { key: "source", label: "Source" },
    { key: "raw", label: "Raw State" },
];

export function Sidebar({ tab, setTab, counts, hasSource, hasSifting }: Props) {
    const tabs = ALL_TABS.filter((t) => {
        if (t.key === "source") return hasSource;
        if (t.key === "sifting") return hasSifting;
        return true;
    });
    return (
        <nav className="sidebar">
            {tabs.map((t) => (
                <div
                    key={t.key}
                    className={"tab" + (tab === t.key ? " active" : "")}
                    onClick={() => setTab(t.key)}
                >
                    {t.label}
                    {t.countKey ? <span className="count">{counts[t.countKey]}</span> : null}
                </div>
            ))}
        </nav>
    );
}
