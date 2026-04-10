"use client";

import { useState, useTransition } from "react";
import { addGuestbookEntry } from "@/lib/actions/guestbook";

interface GuestbookEntry {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
}

const GEOCITIES_SMILEYS = [":-)", ":-D", ":-P", ";-)", ":-*", "8-)", ">:)", ":-/", ":-O", "<3"];

export function Guestbook({ entries: initialEntries }: { entries: GuestbookEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    startTransition(async () => {
      try {
        await addGuestbookEntry(name, message);
        setEntries((prev) => [
          {
            id: crypto.randomUUID(),
            author_name: name.trim(),
            message: message.trim(),
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setName("");
        setMessage("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch {
        // ignore
      }
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }) + " " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const randomSmiley = (i: number) => GEOCITIES_SMILEYS[i % GEOCITIES_SMILEYS.length];

  return (
    <div style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: "#ffff00",
            textShadow: "2px 2px 0 #ff0000, -1px -1px 0 #ff6600",
          }}
        >
          &#9733; SIGN MY GUESTBOOK &#9733;
        </h1>
        <p style={{ color: "#00ffff", fontSize: "14px" }}>
          Leave a message and let the world know you were here!!!
        </p>
        <div
          className="mx-auto my-4"
          style={{
            height: "3px",
            background: "linear-gradient(to right, #ff0000, #ff6600, #ffff00, #00ff00, #0000ff, #ff00ff)",
            maxWidth: "400px",
          }}
        />
      </div>

      {/* Sign form */}
      <div
        className="mx-auto mb-8 p-4"
        style={{
          maxWidth: "500px",
          background: "#000080",
          border: "3px ridge #c0c0c0",
        }}
      >
        <h2
          className="text-center mb-3 text-lg font-bold"
          style={{ color: "#00ff00" }}
        >
          &#9997; Sign the Guestbook!!!
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label style={{ color: "#ffff00", fontSize: "12px", display: "block", marginBottom: "2px" }}>
              Your Name (or Handle):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              className="w-full px-2 py-1"
              style={{
                background: "#fff",
                color: "#000",
                border: "2px inset #808080",
                fontFamily: '"Comic Sans MS", cursive',
                fontSize: "13px",
              }}
              placeholder="xXx_DarkHacker_xXx"
            />
          </div>
          <div>
            <label style={{ color: "#ffff00", fontSize: "12px", display: "block", marginBottom: "2px" }}>
              Your Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              required
              rows={3}
              className="w-full px-2 py-1 resize-none"
              style={{
                background: "#fff",
                color: "#000",
                border: "2px inset #808080",
                fontFamily: '"Comic Sans MS", cursive',
                fontSize: "13px",
              }}
              placeholder="Gr8 site!!! Check out my homepage too!!!"
            />
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={isPending}
              style={{
                background: "linear-gradient(to bottom, #e0e0e0, #a0a0a0)",
                border: "2px outset #c0c0c0",
                padding: "4px 20px",
                fontFamily: '"Comic Sans MS", cursive',
                fontSize: "13px",
                fontWeight: "bold",
                color: "#000",
                cursor: "pointer",
              }}
            >
              {isPending ? "Sending..." : "SIGN!!!"}
            </button>
          </div>
        </form>
        {success && (
          <p
            className="text-center mt-3 font-bold"
            style={{ color: "#00ff00", animation: "geocities-blink 1s step-end infinite" }}
          >
            *** THANKS FOR SIGNING!!! ***
          </p>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {entries.length === 0 && (
          <p className="text-center" style={{ color: "#ff00ff" }}>
            No entries yet... Be the FIRST to sign!!! :-D
          </p>
        )}
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className="p-3"
            style={{
              background: i % 2 === 0 ? "#000040" : "#200040",
              border: "2px ridge #808080",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-bold"
                style={{
                  color: i % 3 === 0 ? "#00ffff" : i % 3 === 1 ? "#ff00ff" : "#ffff00",
                  fontSize: "14px",
                }}
              >
                {randomSmiley(i)} {entry.author_name}
              </span>
              <span style={{ color: "#808080", fontSize: "10px" }}>
                {formatDate(entry.created_at)}
              </span>
            </div>
            <p style={{ color: "#00ff00", fontSize: "13px", whiteSpace: "pre-wrap" }}>
              {entry.message}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <div
          className="mx-auto mb-3"
          style={{
            height: "3px",
            background: "linear-gradient(to right, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)",
            maxWidth: "400px",
          }}
        />
        <p style={{ color: "#808080", fontSize: "10px" }}>
          Guestbook powered by GeoCities&#8482; FreeGuestbook v2.1
        </p>
      </div>
    </div>
  );
}
