export function Ticker({ text }: { text: string }) {
  return (
    <div
      className="mt-[70px] overflow-hidden border-y border-white/[0.08] py-4"
      style={{ background: "rgba(10,10,16,.6)" }}
    >
      <div
        data-gos-anim
        className="flex w-max font-jetbrains-mono text-[13px] tracking-[0.06em]"
        style={{ animation: "tick 34s linear infinite" }}
      >
        <div className="flex gap-[38px] pr-[38px] text-[#9a9aac]">{text}</div>
        <div className="flex gap-[38px] pr-[38px] text-[#9a9aac]" aria-hidden>
          {text}
        </div>
      </div>
    </div>
  );
}
