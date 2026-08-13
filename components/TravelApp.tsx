"use client";

import { useEffect, useMemo, useState } from "react";
import TravelMap from "./TravelMap";
import { supabase } from "@/lib/supabase";

type Person = { id: string; name: string };
type Visit = { user_id: string; country_code: string };

export default function TravelApp() {
  const [people, setPeople] = useState<Person[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [status, setStatus] = useState("Connecting…");

  const activeUser = people.find((p) => p.id === (selectedUser ?? userId));
  const activeVisits = useMemo(
    () =>
      new Set(
        visits
          .filter((v) => v.user_id === (selectedUser ?? userId))
          .map((v) => v.country_code)
      ),
    [visits, selectedUser, userId]
  );

  const leaderboard = useMemo(() => {
    return people
      .map((person) => ({
        ...person,
        count: visits.filter((v) => v.user_id === person.id).length
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [people, visits]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      let session = sessionData.session;

      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          setStatus("Supabase isn't configured yet.");
          return;
        }
        session = data.session;
      }

      if (!mounted || !session) return;
      setUserId(session.user.id);

      const [{ data: peopleData }, { data: visitsData }] = await Promise.all([
        supabase.from("people").select("id,name").order("created_at"),
        supabase.from("visited_countries").select("user_id,country_code")
      ]);

      if (!mounted) return;

      setPeople(peopleData ?? []);
      setVisits(visitsData ?? []);

      const mine = (peopleData ?? []).find((p) => p.id === session.user.id);
      if (mine) setSelectedUser(mine.id);
      setStatus("Live");
    }

    load();

    const channel = supabase
      .channel("travel-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "people" },
        async () => {
          const { data } = await supabase.from("people").select("id,name").order("created_at");
          if (mounted) setPeople(data ?? []);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visited_countries" },
        async () => {
          const { data } = await supabase
            .from("visited_countries")
            .select("user_id,country_code");
          if (mounted) setVisits(data ?? []);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function createPerson() {
    if (!userId || !name.trim()) return;

    setSavingName(true);
    const cleanName = name.trim().slice(0, 30);

    const { error } = await supabase.from("people").upsert(
      { id: userId, name: cleanName },
      { onConflict: "id" }
    );

    if (!error) {
      setPeople((current) => {
        const withoutMe = current.filter((p) => p.id !== userId);
        return [...withoutMe, { id: userId, name: cleanName }];
      });
      setSelectedUser(userId);
      setShowAdd(false);
      setName("");
    } else {
      setStatus(error.message);
    }

    setSavingName(false);
  }

  async function toggleCountry(countryCode: string) {
    if (!userId || !activeUser) {
      setShowAdd(true);
      return;
    }

    const isVisited = activeVisits.has(countryCode);

    if (isVisited) {
      setVisits((current) =>
        current.filter(
          (v) => !(v.user_id === userId && v.country_code === countryCode)
        )
      );
      const { error } = await supabase
        .from("visited_countries")
        .delete()
        .eq("user_id", userId)
        .eq("country_code", countryCode);

      if (error) setStatus(error.message);
    } else {
      setVisits((current) => [
        ...current,
        { user_id: userId, country_code: countryCode }
      ]);
      const { error } = await supabase.from("visited_countries").insert({
        user_id: userId,
        country_code: countryCode
      });

      if (error) setStatus(error.message);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">🌍</div>
          <div>
            <div className="eyebrow">The friend group map</div>
            <h1>Where We&apos;ve Been</h1>
            <p className="sub">{status} · {people.length} travelers</p>
          </div>
        </div>

        {!activeUser && (
          <button className="addButton" onClick={() => setShowAdd(true)}>
            + Add yourself
          </button>
        )}
      </header>

      <section className="grid">
        <div className="card mapCard">
          <div className="mapHeader">
            <div>
              <div className="mapTitle">
                {activeUser ? `${activeUser.name}'s world` : "The world"}
              </div>
              <div className="mapHint">
                {activeUser
                  ? "Click a country to toggle visited."
                  : "Add yourself to start marking countries."}
              </div>
            </div>
            {activeUser && (
              <div className="eyebrow">{activeVisits.size} countries</div>
            )}
          </div>

          <div className="mapFrame">
            <TravelMap
              visited={activeVisits}
              selected={null}
              onCountryClick={toggleCountry}
            />
          </div>
        </div>

        <aside className="side">
          <div className="card profileCard">
            <div className="cardTitle">Travelers</div>

            {people.length === 0 ? (
              <div className="empty">
                Nobody is on the board yet. Be the first to add yourself.
              </div>
            ) : (
              people.map((person) => (
                <button
                  key={person.id}
                  className="profile"
                  style={{
                    width: "100%",
                    border: 0,
                    color: "inherit",
                    textAlign: "left",
                    marginBottom: 8
                  }}
                  onClick={() => setSelectedUser(person.id)}
                >
                  <div className="avatar">{person.name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <div className="profileName">{person.name}</div>
                    <div className="profileCount">
                      {visits.filter((v) => v.user_id === person.id).length} countries
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="card leaderCard">
            <div className="cardTitle">Leaderboard</div>

            {leaderboard.length === 0 ? (
              <div className="empty">Your leaderboard will appear here.</div>
            ) : (
              leaderboard.map((person, index) => (
                <button
                  key={person.id}
                  className="rank"
                  style={{
                    width: "100%",
                    borderTop: 0,
                    borderLeft: 0,
                    borderRight: 0,
                    background: "transparent",
                    color: "inherit",
                    textAlign: "left"
                  }}
                  onClick={() => setSelectedUser(person.id)}
                >
                  <div className="rankNum">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </div>
                  <div className="rankName">{person.name}</div>
                  <div className="rankCount">{person.count}</div>
                </button>
              ))
            )}
          </div>
        </aside>
      </section>

      {showAdd && (
        <div className="modalBack" onMouseDown={() => setShowAdd(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Join the map</h2>
            <p>
              Pick a name for your friend group. Your account is anonymous;
              this name is what everyone else will see.
            </p>
            <input
              autoFocus
              className="input"
              maxLength={30}
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createPerson();
              }}
            />
            <div className="modalActions">
              <button className="cancel" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="saveButton" disabled={savingName} onClick={createPerson}>
                {savingName ? "Joining…" : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}